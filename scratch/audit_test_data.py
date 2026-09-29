import os
import sys
import json
import django

sys.path.insert(0, os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccs_backend.settings')
django.setup()

from django.apps import apps
from django.contrib.auth import get_user_model
from django.db.models import Count, Q

User = get_user_model()

def run_test_data_audit():
    print("=" * 70)
    print("AUDITING POSTGRESQL FOR TEST & QA-GENERATED RECORDS")
    print("=" * 70)

    # 1. Users Audit
    test_user_keywords = ['test', 'qa_', 'audit', 'workflow', 'inactive', 'example.com', 'dummy']
    all_users = User.objects.all()
    print(f"\nTotal Users in DB: {all_users.count()}")
    
    test_users = []
    for u in all_users:
        is_test = False
        reasons = []
        u_str = f"{u.username} {u.email} {u.first_name} {u.last_name}".lower()
        
        for kw in test_user_keywords:
            if kw in u_str:
                is_test = True
                reasons.append(f"Contains keyword '{kw}'")
                
        if is_test:
            test_users.append({
                "id": str(u.id),
                "username": u.username,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "reasons": reasons
            })

    print(f"Suspicious/Test Users identified: {len(test_users)}")
    for tu in test_users:
        print(f"  - [{tu['role']}] ID: {tu['id']} | Email: {tu['email']} | Reasons: {', '.join(tu['reasons'])}")

    # 2. Orders Audit
    from apps.orders.models import Order, OrderItem, OrderTimeline
    total_orders = Order.objects.count()
    print(f"\nTotal Orders in DB: {total_orders}")
    
    test_orders = []
    for o in Order.objects.all():
        reasons = []
        num = (o.order_number or '').lower()
        rem = (o.remarks or '').lower()
        bilty = (o.bilty_number or '').lower()
        lr = (o.lr_number or '').lower()
        
        if 'test' in num or 'test' in rem or 'qa_' in bilty or 'qa_' in lr or 'rt-' in bilty or 'rt-' in lr or 'real-time' in rem:
            reasons.append("Test pattern in order_number/remarks/bilty/lr")
        if o.created_by and any(kw in (o.created_by.email or '').lower() for kw in ['test', 'audit', 'workflow']):
            reasons.append(f"Created by test user {o.created_by.email}")
            
        if reasons:
            test_orders.append({
                "id": str(o.id),
                "order_number": o.order_number,
                "dealer": o.dealer.email if o.dealer else None,
                "status": o.status,
                "bilty_number": o.bilty_number,
                "lr_number": o.lr_number,
                "total_amount": float(getattr(o, 'total', 0) or 0),
                "items_count": o.items.count(),
                "timelines_count": o.timeline.count(),
                "reasons": reasons
            })

    print(f"Suspicious/Test Orders identified: {len(test_orders)}")
    for to in test_orders[:15]:
        print(f"  - Order {to['order_number']} (ID: {to['id']}) | Status: {to['status']} | Items: {to['items_count']} | Reasons: {', '.join(to['reasons'])}")
    if len(test_orders) > 15:
        print(f"  ... and {len(test_orders) - 15} more test orders.")

    # 3. Invoices Audit
    from apps.orders.models import Invoice
    total_inv = Invoice.objects.count()
    print(f"\nTotal Invoices in DB: {total_inv}")
    test_invoices = []
    for inv in Invoice.objects.all():
        num = (inv.invoice_number or '').lower()
        reasons = []
        if 'test' in num or 'qa_' in num or 'rt-' in num:
            reasons.append("Test pattern in invoice_number")
        if inv.order and str(inv.order.id) in [to['id'] for to in test_orders]:
            reasons.append(f"Linked to test order {inv.order.order_number}")
        if reasons:
            test_invoices.append({
                "id": str(inv.id),
                "invoice_number": inv.invoice_number,
                "order_number": inv.order.order_number if inv.order else None,
                "reasons": reasons
            })
    print(f"Suspicious/Test Invoices identified: {len(test_invoices)}")
    for ti in test_invoices:
        print(f"  - Invoice {ti['invoice_number']} | Order: {ti['order_number']} | Reasons: {', '.join(ti['reasons'])}")

    # 4. Wallet & Ledger Entries Audit
    from apps.wallet.models import Wallet, LedgerEntry, Payment
    total_entries = LedgerEntry.objects.count()
    total_payments = Payment.objects.count()
    print(f"\nTotal Ledger Entries: {total_entries} | Total Payments: {total_payments}")
    test_entries = []
    for le in LedgerEntry.objects.all():
        ref = (le.reference or '').lower()
        notes = (le.notes or '').lower()
        reasons = []
        if any(kw in ref for kw in ['step5', 'test', 'qa_', 'isolation', 'rt-']):
            reasons.append(f"Test reference: {le.reference}")
        if any(kw in notes for kw in ['step5', 'test', 'harvest', 'private collection']):
            reasons.append(f"Test notes: {le.notes}")
        if reasons:
            test_entries.append({
                "id": str(le.id),
                "dealer": le.wallet.dealer.email if le.wallet and le.wallet.dealer else None,
                "type": le.type,
                "amount": float(le.amount),
                "reference": le.reference,
                "has_payment": hasattr(le, 'payment_details'),
                "reasons": reasons
            })
    print(f"Suspicious/Test Ledger Entries identified: {len(test_entries)}")
    for te in test_entries[:15]:
        print(f"  - Ledger {te['reference']} | Amount: {te['amount']} | Dealer: {te['dealer']} | Reasons: {', '.join(te['reasons'])}")
    if len(test_entries) > 15:
        print(f"  ... and {len(test_entries) - 15} more test ledger entries.")

    # 5. Inventory & Stock Ledger Audit
    from apps.inventory.models import StockLedger, Warehouse, Godown
    total_stock_tx = StockLedger.objects.count()
    print(f"\nTotal Stock Transactions: {total_stock_tx}")
    test_stock = []
    for sl in StockLedger.objects.all():
        ref = (sl.reference or '').lower()
        rem = (sl.remarks or '').lower()
        reasons = []
        if any(kw in ref for kw in ['test', 'qa_', 'rt-']):
            reasons.append(f"Test reference: {sl.reference}")
        if any(kw in rem for kw in ['test', 'audit', 'step5', 'ord-']):
            reasons.append(f"Test remarks: {sl.remarks}")
        if reasons:
            test_stock.append({
                "id": str(sl.id),
                "product": sl.product.name if sl.product else None,
                "type": sl.type,
                "quantity": sl.quantity,
                "reference": sl.reference,
                "reasons": reasons
            })
    print(f"Suspicious/Test Stock Entries identified: {len(test_stock)}")
    for ts in test_stock[:15]:
        print(f"  - Stock Tx {ts['reference']} | Product: {ts['product']} | Qty: {ts['quantity']} | Reasons: {', '.join(ts['reasons'])}")

    # 6. Support Complaints, Returns & Enquiries Audit
    from apps.support.models import Complaint, ReturnRequest, Enquiry
    print(f"\nComplaints: {Complaint.objects.count()} | Returns: {ReturnRequest.objects.count()} | Enquiries: {Enquiry.objects.count()}")
    test_complaints = []
    for c in Complaint.objects.all():
        desc = (c.description or '').lower()
        reasons = []
        if any(kw in desc for kw in ['test', 'qa', 'audit', 'verification']):
            reasons.append("Test description")
        if c.dealer and any(kw in (c.dealer.email or '').lower() for kw in ['test', 'inactive']):
            reasons.append(f"Filed by test user {c.dealer.email}")
        if reasons:
            test_complaints.append({
                "id": str(c.id),
                "category": c.category,
                "status": c.status,
                "dealer": c.dealer.email if c.dealer else None,
                "reasons": reasons
            })
    print(f"Suspicious/Test Complaints identified: {len(test_complaints)}")

    # 7. HR Attendance & Expenses Audit
    from apps.hr.models import Attendance, Expense, DealerVisit, DailyTourPlan
    print(f"\nAttendance: {Attendance.objects.count()} | Expenses: {Expense.objects.count()} | DealerVisits: {DealerVisit.objects.count()} | TourPlans: {DailyTourPlan.objects.count()}")
    test_expenses = []
    for exp in Expense.objects.all():
        desc = (exp.description or '').lower()
        reasons = []
        if any(kw in desc for kw in ['test', 'audit', 'fuel for dealer visit', 'qa']):
            reasons.append("Test description")
        if exp.employee and any(kw in (exp.employee.email or '').lower() for kw in ['test', 'workflow']):
            reasons.append(f"Claimed by test employee {exp.employee.email}")
        if reasons:
            test_expenses.append({
                "id": str(exp.id),
                "category": exp.category,
                "amount": float(exp.amount),
                "employee": exp.employee.email if exp.employee else None,
                "reasons": reasons
            })
    print(f"Suspicious/Test Expenses identified: {len(test_expenses)}")

    # 8. Notifications Audit
    from apps.notifications.models import Notification
    print(f"\nNotifications: {Notification.objects.count()}")
    test_notifs = []
    for n in Notification.objects.all():
        title = (n.title or '').lower()
        msg = (n.message or '').lower()
        reasons = []
        if any(kw in title for kw in ['real-time order update', 'welcome to ccs partners erp', 'test']):
            reasons.append("Test notification pattern")
        if any(kw in msg for kw in ['ord-test', 'qa_']):
            reasons.append("Linked to test order")
        if reasons:
            test_notifs.append(str(n.id))
    print(f"Suspicious/Test Notifications identified: {len(test_notifs)}")

    # Output JSON summary for detailed report
    summary = {
        "test_users_count": len(test_users),
        "test_orders_count": len(test_orders),
        "test_invoices_count": len(test_invoices),
        "test_ledger_count": len(test_entries),
        "test_stock_count": len(test_stock),
        "test_complaints_count": len(test_complaints),
        "test_expenses_count": len(test_expenses),
        "test_notifications_count": len(test_notifs),
        "test_users": test_users,
        "test_invoices": test_invoices
    }
    with open('scratch/test_data_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    print("\nSummary saved to scratch/test_data_summary.json")

if __name__ == '__main__':
    run_test_data_audit()
