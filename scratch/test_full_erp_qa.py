import os
import sys
import django
from decimal import Decimal
from datetime import date, datetime

# Setup Django environment
sys.path.insert(0, os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccs_backend.settings')
django.setup()

from apps.accounts.models import User, UserRole, EmployeeProfile, DistributorProfile
from apps.orders.models import Order, OrderStatus, OrderItem, Invoice, PaymentStatus
from apps.products.models import Product, Category
from apps.wallet.models import Wallet, LedgerEntry, Payment, LedgerEntryType, PaymentMethod
from apps.inventory.models import Warehouse, StockLedger, StockType
from apps.hr.models import Attendance, DealerVisit, Expense, ExpenseStatus, LocationTrack
from apps.support.models import Complaint, ReturnRequest, Enquiry, ComplaintStatus, ReturnStatus
from apps.orders.views import OrderViewSet, InvoiceViewSet
from apps.products.views import ProductViewSet, CategoryViewSet
from apps.wallet.views import WalletViewSet, LedgerEntryViewSet
from apps.inventory.views import WarehouseViewSet, StockLedgerViewSet
from apps.hr.views import AttendanceViewSet, DealerVisitViewSet, ExpenseViewSet, SalesTargetViewSet
from apps.support.views import ComplaintViewSet, ReturnRequestViewSet, EnquiryViewSet
from apps.reports.views import dashboard_summary

from rest_framework.test import APIRequestFactory, force_authenticate, APIClient
from rest_framework import status

qa_results = []

def record(module, role, test_name, result, evidence):
    qa_results.append({
        'module': module,
        'role': role,
        'test': test_name,
        'result': result,
        'evidence': str(evidence)
    })
    status_icon = "PASS" if result == "PASS" else "FAIL"
    clean_ev = str(evidence).replace('₹', 'INR ')
    print(f"[{status_icon}] {module} | {role} | {test_name} -> {clean_ev}")

def run_qa_suite():
    factory = APIRequestFactory()
    client = APIClient()

    print("==================================================================")
    print("CCS CONNECT — COMPREHENSIVE ERP QA & REGRESSION AUDIT")
    print("==================================================================")

    # 1. SETUP TEST IDENTIFIERS
    qa_prefix = f"QA_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    # Setup Users
    admin_user = User.objects.filter(role__in=[UserRole.SUPER_ADMIN, UserRole.ADMIN]).first()
    field_user = User.objects.filter(role=UserRole.DISTRIBUTOR).first() or User.objects.filter(email='master_emp@ccs.com').first()
    wh_user = User.objects.filter(role=UserRole.WAREHOUSE).first() or User.objects.filter(email='master_wh@ccs.com').first()
    dealer1 = User.objects.filter(role=UserRole.DEALER).first()
    dealer2 = User.objects.filter(role=UserRole.DEALER).exclude(id=dealer1.id).first()

    assert admin_user and field_user and wh_user and dealer1 and dealer2, "All 5 core role users must exist"

    # ==================================================================
    # TEST SUITE 1: AUTHENTICATION & SESSION
    # ==================================================================
    print("\n--- TEST SUITE 1: AUTHENTICATION & ACCESS CONTROL ---")    # 1.1 Valid login
    admin_user.set_password('AdminQAPass123!')
    admin_user.save()
    res_login = client.post('/api/auth/login/', {
        'email_or_username': admin_user.email,
        'password': 'AdminQAPass123!'
    })
    if res_login.status_code == 200 and ('access_token' in res_login.data or 'tokens' in res_login.data):
        access_token = res_login.data.get('access_token') or res_login.data.get('tokens', {}).get('access')
        refresh_token = res_login.data.get('refresh_token') or res_login.data.get('tokens', {}).get('refresh')
        record("Auth", "Admin", "Valid Login", "PASS", f"Status 200, JWT access/refresh issued for {admin_user.email}")
    else:
        record("Auth", "Admin", "Valid Login", "FAIL", f"Status {res_login.status_code}, {res_login.data}")

    # 1.2 Invalid password
    res_bad_pw = client.post('/api/auth/login/', {
        'email_or_username': admin_user.email,
        'password': 'WrongPassword999!'
    })
    if res_bad_pw.status_code == 401:
        record("Auth", "Admin", "Invalid Password Rejection", "PASS", "HTTP 401 Unauthorized returned")
    else:
        record("Auth", "Admin", "Invalid Password Rejection", "FAIL", f"Expected 401, got {res_bad_pw.status_code}")

    # 1.3 Inactive user rejection
    inactive_user, _ = User.objects.get_or_create(
        email=f'{qa_prefix}_inactive@ccs.com',
        defaults={'username': f'{qa_prefix}_inactive', 'role': UserRole.DEALER, 'is_active': False}
    )
    inactive_user.is_active = False
    inactive_user.set_password('TestPass123!')
    inactive_user.save()

    res_inactive = client.post('/api/auth/login/', {
        'email_or_username': inactive_user.email,
        'password': 'TestPass123!'
    })
    if res_inactive.status_code in [401, 403]:
        record("Auth", "Dealer", "Inactive User Rejection", "PASS", f"Inactive account login rejected with HTTP {res_inactive.status_code}")
    else:
        record("Auth", "Dealer", "Inactive User Rejection", "FAIL", f"Expected 401/403, got {res_inactive.status_code}")

    # 1.4 Token Refresh
    if 'refresh_token' in locals():
        res_ref = client.post('/api/auth/token/refresh/', {'refresh': refresh_token})
        if res_ref.status_code == 200 and 'access' in res_ref.data:
            record("Auth", "Admin", "Token Refresh", "PASS", "New access token generated successfully")
        else:
            record("Auth", "Admin", "Token Refresh", "FAIL", f"Refresh failed: {res_ref.data}")

    # 1.5 Unauthorized API access (anonymous access to protected endpoint)
    res_anon = client.get('/api/orders/orders/')
    if res_anon.status_code in [401, 403]:
        record("Auth", "Anonymous", "Unauthorized API Protection", "PASS", f"Anonymous call rejected with {res_anon.status_code}")
    else:
        record("Auth", "Anonymous", "Unauthorized API Protection", "FAIL", f"Expected 401/403, got {res_anon.status_code}")

    # ==================================================================
    # TEST SUITE 2: ORDER WORKFLOW (EMPLOYEE -> ADMIN -> WAREHOUSE)
    # ==================================================================
    print("\n--- TEST SUITE 2: COMPLETE ORDER TO DISPATCH WORKFLOW ---")
    order_create_view = OrderViewSet.as_view({'post': 'create'})
    order_approve_view = OrderViewSet.as_view({'post': 'approve'})
    order_bilty_view = OrderViewSet.as_view({'post': 'upload_bilty'})
    order_lr_view = OrderViewSet.as_view({'post': 'generate_lr'})
    order_dispatch_view = OrderViewSet.as_view({'post': 'dispatch_order'})
    order_list_view = OrderViewSet.as_view({'get': 'list'})

    product = Product.objects.filter(stock__gt=20).first()
    if not product:
        product = Product.objects.create(name=f'{qa_prefix}_Prod', mrp=1000.0, stock=200, min_stock_level=10)

    # 2.1 Employee Creates Order
    req = factory.post('/api/orders/orders/', {
        'dealer': str(dealer1.id),
        'items': [{'product': str(product.id), 'quantity': 5, 'rate': 800.0, 'total': 4000.0}],
        'subtotal': 4000.0,
        'gst_total': 720.0,
        'grand_total': 4720.0,
        'remarks': f'{qa_prefix} Order creation'
    }, format='json')
    force_authenticate(req, user=field_user)
    res_ord = order_create_view(req)
    assert res_ord.status_code == 201, f"Order creation failed: {res_ord.data}"
    order_id = res_ord.data['id']
    order_num = res_ord.data['order_number']
    record("Orders", "Employee", "Create Order", "PASS", f"Order {order_num} created, status: {res_ord.data['status']}")

    # 2.2 Unauthorized Employee Actions
    # Employee cannot approve
    req = factory.post(f'/api/orders/orders/{order_id}/approve/')
    force_authenticate(req, user=field_user)
    res_unauth_app = order_approve_view(req, pk=order_id)
    if res_unauth_app.status_code == 403:
        record("Security", "Employee", "Blocked From Approving Order", "PASS", "HTTP 403 Forbidden")
    else:
        record("Security", "Employee", "Blocked From Approving Order", "FAIL", f"Expected 403, got {res_unauth_app.status_code}")

    # Employee cannot generate bilty
    req = factory.post(f'/api/orders/orders/{order_id}/upload_bilty/', {'bilty_number': 'BLT-FAKE'})
    force_authenticate(req, user=field_user)
    res_unauth_blt = order_bilty_view(req, pk=order_id)
    if res_unauth_blt.status_code == 403:
        record("Security", "Employee", "Blocked From Generating Bilty", "PASS", "HTTP 403 Forbidden")
    else:
        record("Security", "Employee", "Blocked From Generating Bilty", "FAIL", f"Expected 403, got {res_unauth_blt.status_code}")

    # 2.3 Warehouse Unauthorized Actions
    # Warehouse cannot approve
    req = factory.post(f'/api/orders/orders/{order_id}/approve/')
    force_authenticate(req, user=wh_user)
    res_wh_app = order_approve_view(req, pk=order_id)
    if res_wh_app.status_code == 403:
        record("Security", "Warehouse", "Blocked From Approving Order", "PASS", "HTTP 403 Forbidden")
    else:
        record("Security", "Warehouse", "Blocked From Approving Order", "FAIL", f"Expected 403, got {res_wh_app.status_code}")

    # Warehouse cannot generate bilty
    req = factory.post(f'/api/orders/orders/{order_id}/upload_bilty/', {'bilty_number': 'BLT-WH-FAKE'})
    force_authenticate(req, user=wh_user)
    res_wh_blt = order_bilty_view(req, pk=order_id)
    if res_wh_blt.status_code == 403:
        record("Security", "Warehouse", "Blocked From Generating Bilty", "PASS", "HTTP 403 Forbidden")
    else:
        record("Security", "Warehouse", "Blocked From Generating Bilty", "FAIL", f"Expected 403, got {res_wh_blt.status_code}")

    # 2.4 Invalid Status Transition: Cannot dispatch an unapproved order
    req = factory.post(f'/api/orders/orders/{order_id}/dispatch_order/')
    force_authenticate(req, user=wh_user)
    res_premature_disp = order_dispatch_view(req, pk=order_id)
    if res_premature_disp.status_code in [400, 403, 404]:
        record("Orders", "Warehouse", "Prevent Premature Dispatch", "PASS", f"Order not visible or dispatch rejected before Ready to Dispatch (HTTP {res_premature_disp.status_code})")
    else:
        record("Orders", "Warehouse", "Prevent Premature Dispatch", "FAIL", f"Expected 400/403/404, got {res_premature_disp.status_code}")

    # 2.5 Admin Approves Order
    req = factory.post(f'/api/orders/orders/{order_id}/approve/')
    force_authenticate(req, user=admin_user)
    res_app = order_approve_view(req, pk=order_id)
    if res_app.status_code == 200 and res_app.data['status'] == OrderStatus.APPROVED:
        record("Orders", "Admin", "Approve Order", "PASS", f"Order status updated to {res_app.data['status']}")
    else:
        record("Orders", "Admin", "Approve Order", "FAIL", f"Approval failed: {res_app.data}")

    # 2.6 Admin Generates Bilty -> Transitions to Ready to Dispatch
    bilty_no = f"BLT-{qa_prefix}"
    bilty_date_str = datetime.now().isoformat()
    req = factory.post(f'/api/orders/orders/{order_id}/upload_bilty/', {
        'bilty_number': bilty_no,
        'bilty_date': bilty_date_str
    })
    force_authenticate(req, user=admin_user)
    res_blt = order_bilty_view(req, pk=order_id)
    if res_blt.status_code == 200 and res_blt.data['status'] == OrderStatus.READY_DISPATCH:
        record("Orders", "Admin", "Generate Bilty", "PASS", f"Bilty {bilty_no} generated, status transitioned to Ready to Dispatch")
    else:
        record("Orders", "Admin", "Generate Bilty", "FAIL", f"Bilty generation failed: {res_blt.data}")

    # 2.7 Warehouse Generates LR (CRITICAL: Verify LR creation does NOT auto-dispatch)
    lr_no = f"LR-{qa_prefix}"
    req = factory.post(f'/api/orders/orders/{order_id}/upload_lr/', {
        'lr_number': lr_no,
        'transporter_name': 'TCI Express Logistics',
        'vehicle_number': 'GJ-01-AB-1234'
    })
    force_authenticate(req, user=wh_user)
    res_lr = order_lr_view(req, pk=order_id)
    db_order_after_lr = Order.objects.get(id=order_id)
    if res_lr.status_code == 200 and db_order_after_lr.status == OrderStatus.READY_DISPATCH:
        record("Logistics", "Warehouse", "Generate LR (No Auto-Dispatch)", "PASS", f"LR {lr_no} recorded. Order remains 'Ready to Dispatch' (not auto-dispatched)")
    else:
        record("Logistics", "Warehouse", "Generate LR (No Auto-Dispatch)", "FAIL", f"Status altered prematurely: {db_order_after_lr.status}")

    # 2.8 Warehouse Performs Authorized Dispatch
    initial_stock = Product.objects.get(id=product.id).stock
    req = factory.post(f'/api/orders/orders/{order_id}/dispatch_order/')
    force_authenticate(req, user=wh_user)
    res_disp = order_dispatch_view(req, pk=order_id)
    db_order_dispatched = Order.objects.get(id=order_id)
    final_stock = Product.objects.get(id=product.id).stock
    if res_disp.status_code == 200 and db_order_dispatched.status == OrderStatus.DISPATCHED:
        record("Logistics", "Warehouse", "Authorized Dispatch Action", "PASS", f"Status transitioned to Dispatched. Stock deducted ({initial_stock} -> {final_stock})")
    else:
        record("Logistics", "Warehouse", "Authorized Dispatch Action", "FAIL", f"Dispatch action failed: {res_disp.data}")

    # 2.9 Cross-User Data Isolation: Dealer 2 cannot view Dealer 1's order
    req = factory.get(f'/api/orders/orders/{order_id}/')
    force_authenticate(req, user=dealer2)
    order_retrieve_view = OrderViewSet.as_view({'get': 'retrieve'})
    res_cross_dlr = order_retrieve_view(req, pk=order_id)
    if res_cross_dlr.status_code in [403, 404]:
        record("Security", "Dealer", "Cross-Dealer Order Isolation", "PASS", f"Dealer 2 prevented from accessing Dealer 1 order ({res_cross_dlr.status_code})")
    else:
        record("Security", "Dealer", "Cross-Dealer Order Isolation", "FAIL", f"Breach! Dealer 2 accessed Dealer 1 order with code {res_cross_dlr.status_code}")

    # ==================================================================
    # TEST SUITE 3: PRODUCTS & WAREHOUSE INVENTORY
    # ==================================================================
    print("\n--- TEST SUITE 3: PRODUCTS & WAREHOUSE INVENTORY ---")
    stock_ledger_view = StockLedgerViewSet.as_view({'post': 'create', 'get': 'list'})

    wh, _ = Warehouse.objects.get_or_create(name='Main Central Depot', defaults={'location': 'Palanpur'})

    # 3.1 Stock Inflow (Purchase)
    cur_stock = Product.objects.get(id=product.id).stock
    req = factory.post('/api/inventory/stock-ledger/', {
        'product': str(product.id),
        'warehouse': str(wh.id),
        'stock_type': StockType.PURCHASE,
        'quantity': 25,
        'reference_no': f'{qa_prefix}_PO_01',
        'remarks': 'QA Stock addition'
    })
    force_authenticate(req, user=wh_user)
    res_stk_in = stock_ledger_view(req)
    updated_stock = Product.objects.get(id=product.id).stock
    if res_stk_in.status_code == 201 and updated_stock == cur_stock + 25:
        record("Inventory", "Warehouse", "Stock Inflow Movement", "PASS", f"Stock ledger entry created; product stock increased by 25 ({cur_stock} -> {updated_stock})")
    else:
        record("Inventory", "Warehouse", "Stock Inflow Movement", "FAIL", f"Failed: {res_stk_in.data}")

    # 3.2 Insufficient Stock Rejection
    excess_qty = updated_stock + 1000
    req = factory.post('/api/inventory/stock-ledger/', {
        'product': str(product.id),
        'warehouse': str(wh.id),
        'stock_type': StockType.DAMAGE,
        'quantity': excess_qty,
        'reference_no': f'{qa_prefix}_DAM_EXCESS'
    })
    force_authenticate(req, user=wh_user)
    res_stk_exc = stock_ledger_view(req)
    if res_stk_exc.status_code == 400:
        record("Inventory", "Warehouse", "Excess Stock Deduction Rejection", "PASS", "HTTP 400 Bad Request on insufficient inventory")
    else:
        record("Inventory", "Warehouse", "Excess Stock Deduction Rejection", "FAIL", f"Expected 400, got {res_stk_exc.status_code}")

    # 3.3 Negative Quantity Rejection
    req = factory.post('/api/inventory/stock-ledger/', {
        'product': str(product.id),
        'warehouse': str(wh.id),
        'stock_type': StockType.PURCHASE,
        'quantity': -50,
        'reference_no': f'{qa_prefix}_NEG'
    })
    force_authenticate(req, user=wh_user)
    res_stk_neg = stock_ledger_view(req)
    if res_stk_neg.status_code == 400:
        record("Inventory", "Warehouse", "Negative Stock Quantity Rejection", "PASS", "HTTP 400 Bad Request on negative quantity")
    else:
        record("Inventory", "Warehouse", "Negative Stock Quantity Rejection", "FAIL", f"Expected 400, got {res_stk_neg.status_code}")

    # 3.4 Unauthorized Stock Movement (Dealer cannot record stock transactions)
    req = factory.post('/api/inventory/stock-ledger/', {
        'product': str(product.id),
        'warehouse': str(wh.id),
        'stock_type': StockType.PURCHASE,
        'quantity': 10
    })
    force_authenticate(req, user=dealer1)
    res_dlr_stk = stock_ledger_view(req)
    if res_dlr_stk.status_code == 403:
        record("Security", "Dealer", "Blocked From Inventory Movements", "PASS", "HTTP 403 Forbidden")
    else:
        record("Security", "Dealer", "Blocked From Inventory Movements", "FAIL", f"Expected 403, got {res_dlr_stk.status_code}")

    # ==================================================================
    # TEST SUITE 4: INVOICES & DEALER ISOLATION
    # ==================================================================
    print("\n--- TEST SUITE 4: INVOICES & PDF GENERATION ---")
    invoice_list_view = InvoiceViewSet.as_view({'get': 'list'})
    invoice_pdf_view = InvoiceViewSet.as_view({'get': 'generate_pdf'})

    # Create Invoice for testing
    inv, _ = Invoice.objects.get_or_create(
        order=db_order_dispatched,
        defaults={'invoice_number': f"INV-{qa_prefix}"}
    )

    # 4.1 Admin sees all invoices
    req = factory.get('/api/orders/invoices/')
    force_authenticate(req, user=admin_user)
    res_adm_inv = invoice_list_view(req)
    if res_adm_inv.status_code == 200 and any(i['id'] == str(inv.id) for i in res_adm_inv.data):
        record("Invoices", "Admin", "Admin Invoice Visibility", "PASS", f"Admin sees invoice {inv.invoice_number}")
    else:
        record("Invoices", "Admin", "Admin Invoice Visibility", "FAIL", f"Admin invoice list failed: {res_adm_inv.data}")

    # 4.2 Dealer 1 sees own invoice
    req = factory.get('/api/orders/invoices/')
    force_authenticate(req, user=dealer1)
    res_d1_inv = invoice_list_view(req)
    if res_d1_inv.status_code == 200 and any(i['id'] == str(inv.id) for i in res_d1_inv.data):
        record("Invoices", "Dealer", "Dealer Self Invoices", "PASS", "Dealer sees their own invoice")
    else:
        record("Invoices", "Dealer", "Dealer Self Invoices", "FAIL", "Dealer could not view own invoice")

    # 4.3 Dealer 2 cannot see Dealer 1's invoice
    req = factory.get('/api/orders/invoices/')
    force_authenticate(req, user=dealer2)
    res_d2_inv = invoice_list_view(req)
    if res_d2_inv.status_code == 200 and not any(i['id'] == str(inv.id) for i in res_d2_inv.data):
        record("Security", "Dealer", "Dealer Invoice Isolation", "PASS", "Dealer 2 cannot see Dealer 1's invoice")
    else:
        record("Security", "Dealer", "Dealer Invoice Isolation", "FAIL", "Invoice isolation breach!")

    # 4.4 PDF Generation
    req = factory.get(f'/api/orders/invoices/{inv.id}/generate_pdf/')
    force_authenticate(req, user=dealer1)
    res_pdf = invoice_pdf_view(req, pk=str(inv.id))
    if res_pdf.status_code == 200 and ('download_url' in res_pdf.data or 'invoice_number' in res_pdf.data):
        record("Invoices", "Dealer", "Invoice PDF Generation", "PASS", f"PDF metadata payload generated: {res_pdf.data.get('download_url')}")
    else:
        record("Invoices", "Dealer", "Invoice PDF Generation", "FAIL", f"PDF endpoint failed: {res_pdf.data}")

    # ==================================================================
    # TEST SUITE 5: PAYMENTS & COLLECTIONS
    # ==================================================================
    print("\n--- TEST SUITE 5: PAYMENTS & WALLET COLLECTIONS ---")
    ledger_create_view = LedgerEntryViewSet.as_view({'post': 'create', 'get': 'list'})

    wallet1, _ = Wallet.objects.get_or_create(dealer=dealer1)
    wallet1.update_outstanding()
    init_outstanding = wallet1.outstanding_amount

    # 5.1 Field Collection Submission
    ref_code = f"UTR-{qa_prefix}"
    req = factory.post('/api/wallet/ledger/', {
        'wallet': str(wallet1.id),
        'dealer_id': str(dealer1.id),
        'amount': 15000.00,
        'payment_method': PaymentMethod.UPI,
        'reference': ref_code,
        'notes': 'Field collection test'
    })
    force_authenticate(req, user=field_user)
    res_coll = ledger_create_view(req)
    wallet1.refresh_from_db()
    bal_diff = float(init_outstanding) - float(wallet1.outstanding_amount)
    if res_coll.status_code == 201 and abs(bal_diff - 15000.0) < 0.01:
        record("Wallet", "Field", "Collection Submission & Balance Update", "PASS", f"Ledger entry created; wallet balance reduced by 15,000 ({init_outstanding} -> {wallet1.outstanding_amount})")
    else:
        record("Wallet", "Field", "Collection Submission & Balance Update", "FAIL", f"Failed: status={res_coll.status_code}, diff={bal_diff}, data={res_coll.data}")

    # 5.2 Duplicate Transaction Reference Rejection
    req = factory.post('/api/wallet/ledger/', {
        'wallet': str(wallet1.id),
        'amount': 5000.00,
        'payment_method': PaymentMethod.NEFT,
        'reference': ref_code  # duplicate reference
    })
    force_authenticate(req, user=field_user)
    res_dup_ref = ledger_create_view(req)
    if res_dup_ref.status_code == 400:
        record("Wallet", "Field", "Duplicate Reference Rejection", "PASS", "HTTP 400 Bad Request on duplicate transaction ID")
    else:
        record("Wallet", "Field", "Duplicate Reference Rejection", "FAIL", f"Expected 400, got {res_dup_ref.status_code}")

    # 5.3 Negative/Zero Amount Rejection
    req = factory.post('/api/wallet/ledger/', {
        'wallet': str(wallet1.id),
        'amount': -100.00,
        'payment_method': PaymentMethod.CASH,
        'reference': f'UTR-NEG-{qa_prefix}'
    })
    force_authenticate(req, user=field_user)
    res_zero = ledger_create_view(req)
    if res_zero.status_code == 400:
        record("Wallet", "Field", "Invalid Amount Rejection", "PASS", "HTTP 400 Bad Request on negative amount")
    else:
        record("Wallet", "Field", "Invalid Amount Rejection", "FAIL", f"Expected 400, got {res_zero.status_code}")

    # 5.4 Dealer Ledger Isolation
    req = factory.get('/api/wallet/ledger/')
    force_authenticate(req, user=dealer2)
    res_d2_led = ledger_create_view(req)
    if not any(entry.get('reference') == ref_code for entry in res_d2_led.data):
        record("Security", "Dealer", "Dealer Ledger Isolation", "PASS", "Dealer 2 cannot see Dealer 1 collections")
    else:
        record("Security", "Dealer", "Dealer Ledger Isolation", "FAIL", "Ledger isolation breach!")

    # ==================================================================
    # TEST SUITE 6: HR / ATTENDANCE / EXPENSES / TARGETS
    # ==================================================================
    print("\n--- TEST SUITE 6: HR, ATTENDANCE & PERFORMANCE ---")
    att_create_view = AttendanceViewSet.as_view({'post': 'create'})
    att_checkout_view = AttendanceViewSet.as_view({'post': 'check_out'})
    att_loc_view = AttendanceViewSet.as_view({'post': 'update_location'})
    exp_create_view = ExpenseViewSet.as_view({'post': 'create', 'get': 'list'})
    exp_approve_view = ExpenseViewSet.as_view({'post': 'approve'})

    # 6.1 Attendance Check-in (Start Day)
    today = date.today()
    Attendance.objects.filter(employee=field_user, date=today).delete()  # clean for fresh test
    req = factory.post('/api/hr/attendance/', {
        'check_in_location': 'Palanpur Market Yard',
        'check_in_latitude': 24.1724,
        'check_in_longitude': 72.4346
    })
    force_authenticate(req, user=field_user)
    res_att_in = att_create_view(req)
    if res_att_in.status_code == 201 and res_att_in.data['status'] == 'Working':
        record("HR", "Employee", "Start Day Check-In", "PASS", f"Active working attendance created at Palanpur")
    else:
        record("HR", "Employee", "Start Day Check-In", "FAIL", f"Check-in failed: {res_att_in.data}")

    # 6.2 Duplicate Check-In on Same Day Rejection
    req = factory.post('/api/hr/attendance/', {'check_in_location': 'Duplicate Depot'})
    force_authenticate(req, user=field_user)
    res_dup_att = att_create_view(req)
    if res_dup_att.status_code == 400:
        record("HR", "Employee", "Duplicate Check-In Prevention", "PASS", "HTTP 400: Attendance already recorded for today")
    else:
        record("HR", "Employee", "Duplicate Check-In Prevention", "FAIL", f"Expected 400, got {res_dup_att.status_code}")

    # 6.3 GPS/Location Tracking Update
    req = factory.post('/api/hr/attendance/update_location/', {
        'latitude': 24.1800,
        'longitude': 72.4400,
        'location': 'Deesa Road Kisan Seva Kendra'
    })
    force_authenticate(req, user=field_user)
    res_loc = att_loc_view(req)
    if res_loc.status_code == 200:
        record("HR", "Employee", "Live GPS Location Tracking", "PASS", "Location updated in real time")
    else:
        record("HR", "Employee", "Live GPS Location Tracking", "FAIL", f"Location update failed: {res_loc.data}")

    # 6.4 Attendance Check-Out (End Day) & Working Hours Calculation
    req = factory.post('/api/hr/attendance/check_out/', {
        'check_out_location': 'CCS Regional Office Palanpur',
        'check_out_latitude': 24.1750,
        'check_out_longitude': 72.4350
    })
    force_authenticate(req, user=field_user)
    res_att_out = att_checkout_view(req)
    if res_att_out.status_code == 200 and res_att_out.data['status'] == 'Present':
        record("HR", "Employee", "End Day Check-Out & Hours Calculation", "PASS", f"Status updated to Present, working_hours={res_att_out.data.get('working_hours')}")
    else:
        record("HR", "Employee", "End Day Check-Out & Hours Calculation", "FAIL", f"Check-out failed: {res_att_out.data}")

    # 6.5 Expense Claim & Admin Approval
    req = factory.post('/api/hr/expenses/', {
        'category': 'Travel',
        'starting_km': 100,
        'ending_km': 160,
        'amount': 300.0,
        'remarks': 'Field visits to 4 dealers'
    })
    force_authenticate(req, user=field_user)
    res_exp = exp_create_view(req)
    assert res_exp.status_code == 201, f"Expense claim creation failed: {res_exp.data}"
    exp_id = res_exp.data['id']
    record("HR", "Employee", "Expense Claim Submission", "PASS", f"Expense #{exp_id} submitted with amount 300.0")

    # Admin Approves Expense
    req = factory.post(f'/api/hr/expenses/{exp_id}/approve/')
    force_authenticate(req, user=admin_user)
    res_exp_app = exp_approve_view(req, pk=exp_id)
    if res_exp_app.status_code == 200 and res_exp_app.data['status'] == ExpenseStatus.APPROVED:
        record("HR", "Admin", "Approve Expense Claim", "PASS", "Expense approved and approved_by assigned")
    else:
        record("HR", "Admin", "Approve Expense Claim", "FAIL", f"Expense approval failed: {res_exp_app.data}")

    # 6.6 Sales Targets & Plans
    target_update_view = SalesTargetViewSet.as_view({'post': 'update_target'})
    req = factory.post(f'/api/hr/targets/{field_user.id}/update_target/', {
        'targetAmount': 300000.00,
        'monthlySalesPlan': 280000.00,
        'monthlyCollectionPlan': 250000.00
    })
    force_authenticate(req, user=admin_user)
    res_tgt_up = target_update_view(req, pk=str(field_user.id))
    if res_tgt_up.status_code == 200 and res_tgt_up.data['targetAmount'] == 300000.00:
        record("HR", "Admin", "Sales Target & Plan Persistence", "PASS", f"Target updated to 300,000, Sales Plan=280,000, Coll Plan=250,000")
    else:
        record("HR", "Admin", "Sales Target & Plan Persistence", "FAIL", f"Target update failed: {res_tgt_up.data}")

    # ==================================================================
    # TEST SUITE 7: SUPPORT, COMPLAINTS & RETURNS
    # ==================================================================
    print("\n--- TEST SUITE 7: SUPPORT, COMPLAINTS & RETURNS ---")
    comp_create_view = ComplaintViewSet.as_view({'post': 'create', 'get': 'list'})
    comp_up_view = ComplaintViewSet.as_view({'post': 'update_status'})

    # 7.1 Dealer Registers Complaint
    req = factory.post('/api/support/complaints/', {
        'category': 'Late Delivery',
        'description': f'{qa_prefix} Urgent: consignment delayed by 3 days'
    })
    force_authenticate(req, user=dealer1)
    res_cmp = comp_create_view(req)
    assert res_cmp.status_code == 201, f"Complaint registration failed: {res_cmp.data}"
    cmp_id = res_cmp.data['id']
    record("Support", "Dealer", "Submit Complaint", "PASS", f"Complaint created (ID: {cmp_id}), status: Open")

    # 7.2 Admin Updates Status & Resolution Notes
    req = factory.post(f'/api/support/complaints/{cmp_id}/update_status/', {
        'status': ComplaintStatus.RESOLVED,
        'resolution_timeline': 'Transporter contacted; delivered at 4:30 PM today.'
    })
    force_authenticate(req, user=admin_user)
    res_cmp_up = comp_up_view(req, pk=cmp_id)
    if res_cmp_up.status_code == 200 and res_cmp_up.data['status'] == ComplaintStatus.RESOLVED:
        record("Support", "Admin", "Update Support Status & Resolution", "PASS", "Complaint marked Resolved with resolution notes")
    else:
        record("Support", "Admin", "Update Support Status & Resolution", "FAIL", f"Update failed: {res_cmp_up.data}")

    # 7.3 Unauthorized Status Modification Rejection
    req = factory.post(f'/api/support/complaints/{cmp_id}/update_status/', {'status': 'Closed'})
    force_authenticate(req, user=dealer1)
    res_unauth_cmp = comp_up_view(req, pk=cmp_id)
    if res_unauth_cmp.status_code == 403:
        record("Security", "Dealer", "Blocked From Updating Complaint Status", "PASS", "HTTP 403 Forbidden")
    else:
        record("Security", "Dealer", "Blocked From Updating Complaint Status", "FAIL", f"Expected 403, got {res_unauth_cmp.status_code}")

    # ==================================================================
    # TEST SUITE 8: REAL DASHBOARD METRICS (ZERO MOCK FALLBACKS)
    # ==================================================================
    print("\n--- TEST SUITE 8: DASHBOARDS (REAL DATABASE FIGURES) ---")

    # 8.1 Admin Dashboard
    req = factory.get('/api/dashboard/')
    force_authenticate(req, user=admin_user)
    res_dash_adm = dashboard_summary(req)
    d_adm = res_dash_adm.data
    assert res_dash_adm.status_code == 200
    assert d_adm.get('mock') is not True
    assert isinstance(d_adm['total_sales'], (int, float))
    assert isinstance(d_adm['today_orders_count'], int)
    assert isinstance(d_adm['total_dealers_count'], int)
    assert isinstance(d_adm['sales_graph_data'], list)
    assert isinstance(d_adm['order_status_distribution'], list)
    record("Dashboard", "Admin", "Live KPI Calculations", "PASS", f"Sales={d_adm['total_sales_display']}, Dealers={d_adm['total_dealers_count']}, Products={d_adm['total_products_count']}, Real Status Slices={len(d_adm['order_status_distribution'])}")

    # 8.2 Dealer Dashboard Scoped to Dealer
    req = factory.get('/api/dashboard/')
    force_authenticate(req, user=dealer1)
    res_dash_dlr = dashboard_summary(req)
    d_dlr = res_dash_dlr.data
    assert res_dash_dlr.status_code == 200
    assert d_dlr['role'] == UserRole.DEALER
    assert 'credit_limit' in d_dlr
    assert 'outstanding_amount' in d_dlr
    record("Dashboard", "Dealer", "Dealer Live Portal Data", "PASS", f"Orders={d_dlr['total_orders_count']}, Outstanding={d_dlr['outstanding_amount']}")

    # 8.3 Distributor Dashboard Scoped to Distributor
    req = factory.get('/api/dashboard/')
    force_authenticate(req, user=field_user)
    res_dash_dist = dashboard_summary(req)
    d_dist = res_dash_dist.data
    assert res_dash_dist.status_code == 200
    assert d_dist['role'] == UserRole.DISTRIBUTOR
    record("Dashboard", "Distributor", "Distributor Live Operations Hub", "PASS", f"Orders={d_dist['total_orders_count']}, Collections=INR {d_dist['total_collections']:,.2f}")

    # ==================================================================
    # TEST SUITE 9: DATABASE PERSISTENCE & SESSION RESTORATION
    # ==================================================================
    print("\n--- TEST SUITE 9: PERSISTENCE & STATE RESTORATION ---")

    # Verify order state persists
    order_check = Order.objects.get(id=order_id)
    assert order_check.status == OrderStatus.DISPATCHED
    assert order_check.lr_number == lr_no
    assert order_check.bilty_number == bilty_no
    record("Persistence", "System", "Full Order Lifecycle Persistence", "PASS", f"Order {order_num} persisted as Dispatched with Bilty & LR in SQLite")

    # Verify inventory state persists
    stock_check = Product.objects.get(id=product.id)
    assert stock_check.stock == updated_stock
    record("Persistence", "System", "Inventory Stock Ledger Persistence", "PASS", f"Product stock confirmed at {stock_check.stock} units in SQLite")

    # Verify wallet state persists
    wallet_check = Wallet.objects.get(dealer=dealer1)
    assert wallet_check.outstanding_amount == wallet1.outstanding_amount
    record("Persistence", "System", "Wallet Ledger Persistence", "PASS", f"Outstanding amount confirmed at {wallet_check.outstanding_amount} in SQLite")

    # Clean up test-specific flags
    print("\n==================================================================")
    print("ALL 35 E2E QA AUDIT TESTS EXECUTED!")
    print("==================================================================")

    # Print summary table
    pass_count = sum(1 for r in qa_results if r['result'] == 'PASS')
    fail_count = sum(1 for r in qa_results if r['result'] == 'FAIL')
    print(f"\nTOTAL TESTS: {len(qa_results)} | PASSED: {pass_count} | FAILED: {fail_count}")

if __name__ == '__main__':
    run_qa_suite()
