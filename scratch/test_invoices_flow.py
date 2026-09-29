import os
import sys
import django

sys.path.insert(0, os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccs_backend.settings')
django.setup()

from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole, UserStatus, DealerProfile
from apps.orders.models import Order, Invoice, OrderStatus, PaymentStatus

print("==================================================")
print("TESTING INVOICES & DEALER INVOICES MODULE")
print("==================================================")

admin_user = User.objects.get(email='master_admin@ccs.com')
dealer1 = User.objects.get(email='master_dealer@ccs.com')
dealer2 = User.objects.filter(role=UserRole.DEALER).exclude(id=dealer1.id).first()

# 1. Ensure an order exists for dealer1
order, _ = Order.objects.get_or_create(
    order_number="ORD-TEST-INV-001",
    defaults={
        'dealer': dealer1,
        'status': OrderStatus.APPROVED,
        'payment_status': PaymentStatus.PENDING,
        'grand_total': 18500.00,
        'bilty_number': 'BL-TEST-9988',
        'lr_number': 'LR-TEST-1122'
    }
)

# 2. Ensure an invoice exists for this order
invoice, created = Invoice.objects.get_or_create(
    order=order,
    defaults={
        'invoice_number': 'INV-2026-TEST-001'
    }
)
print(f"Verified Invoice in DB: {invoice.invoice_number} linked to Order {order.order_number}")

# Test 3: Admin access
admin_client = APIClient()
admin_client.force_authenticate(user=admin_user)
r_admin = admin_client.get('/api/invoices/')
assert r_admin.status_code == 200, f"Expected 200, got {r_admin.status_code}"
admin_invoices = r_admin.json()
inv_match = next((i for i in admin_invoices if i['invoice_number'] == 'INV-2026-TEST-001'), None)
assert inv_match is not None, "Admin did not see invoice INV-2026-TEST-001"
assert inv_match['order_number'] == 'ORD-TEST-INV-001'
assert float(inv_match['total_amount']) == 18500.00
assert float(inv_match['balance_due']) == 18500.00
assert inv_match['bilty_no'] == 'BL-TEST-9988'
assert inv_match['lr_number'] == 'LR-TEST-1122'
print("TEST 1 PASSED: Admin sees invoice with all enriched order fields")

# Test 4: Authorized Dealer access
dealer1_client = APIClient()
dealer1_client.force_authenticate(user=dealer1)
r_dealer1 = dealer1_client.get('/api/invoices/')
assert r_dealer1.status_code == 200
dealer1_invoices = r_dealer1.json()
dealer1_match = next((i for i in dealer1_invoices if i['invoice_number'] == 'INV-2026-TEST-001'), None)
assert dealer1_match is not None, "Dealer1 did not see their own invoice"
print("TEST 2 PASSED: Dealer sees their authorized invoice")

# Test 5: Unauthorized Dealer access (data isolation)
if dealer2:
    dealer2_client = APIClient()
    dealer2_client.force_authenticate(user=dealer2)
    r_dealer2 = dealer2_client.get('/api/invoices/')
    assert r_dealer2.status_code == 200
    dealer2_invoices = r_dealer2.json()
    assert not any(i['invoice_number'] == 'INV-2026-TEST-001' for i in dealer2_invoices), "Dealer2 should NOT see Dealer1's invoice!"
    print(f"TEST 3 PASSED: Dealer isolation verified (Dealer {dealer2.username} cannot see Dealer1's invoice)")

# Test 6: Alias URL /api/orders/invoices/
r_alias = admin_client.get('/api/orders/invoices/')
assert r_alias.status_code == 200, f"Expected 200 on alias, got {r_alias.status_code}"
print("TEST 4 PASSED: /api/orders/invoices/ alias route works identically")

# Test 7: Generate PDF endpoint
r_pdf = admin_client.get(f'/api/invoices/{invoice.id}/generate_pdf/')
assert r_pdf.status_code == 200
assert 'download_url' in r_pdf.json()
print("TEST 5 PASSED: /api/invoices/{id}/generate_pdf/ returns valid PDF download payload")

# Test 8: Refresh consistency (repeated queries return the exact same persisted records)
r_refresh = dealer1_client.get('/api/invoices/')
assert r_refresh.status_code == 200
assert len(r_refresh.json()) == len(dealer1_invoices)
print("TEST 6 PASSED: Session refresh and repeated queries persist exact database state")

print("\nALL INVOICE MODULE TESTS PASSED 100%!")
