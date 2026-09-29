import os
import sys
import django
from decimal import Decimal

# Setup Django environment
sys.path.insert(0, os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccs_backend.settings')
django.setup()

from apps.accounts.models import User, UserRole
from apps.products.models import Product
from apps.wallet.models import Wallet, LedgerEntry, Payment, LedgerEntryType
from apps.inventory.models import Warehouse, StockLedger, StockType
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.wallet.views import WalletViewSet, LedgerEntryViewSet
from apps.inventory.views import WarehouseViewSet, StockLedgerViewSet

def run_tests():
    factory = APIRequestFactory()

    print("================================================================")
    print("STEP 5: COLLECTIONS, PAYMENTS, & WAREHOUSE STOCK E2E TEST")
    print("================================================================")

    # 1. Fetch test users
    admin_user = User.objects.filter(role__in=[UserRole.SUPER_ADMIN, UserRole.ADMIN]).first()
    field_user = User.objects.filter(role=UserRole.DISTRIBUTOR).first() or User.objects.filter(email='master_emp@ccs.com').first()
    wh_user = User.objects.filter(role=UserRole.WAREHOUSE).first() or User.objects.filter(email='master_wh@ccs.com').first()
    dealer_user = User.objects.filter(role=UserRole.DEALER).first()
    dealer2_user = User.objects.filter(role=UserRole.DEALER).exclude(id=dealer_user.id).first()

    assert admin_user, "Admin user required"
    assert field_user, "Field user required"
    assert wh_user, "Warehouse user required"
    assert dealer_user, "Dealer user required"
    if not dealer2_user:
        # Create a second dealer for isolation test
        dealer2_user = User.objects.create_user(
            username='dealer2_step5_test',
            email='dealer2_step5@ccs.com',
            password='TestPass123!',
            role=UserRole.DEALER
        )

    print(f"Users ready:")
    print(f"  Admin: {admin_user.email} ({admin_user.role})")
    print(f"  Field: {field_user.email} ({field_user.role})")
    print(f"  Warehouse: {wh_user.email} ({wh_user.role})")
    print(f"  Dealer 1: {dealer_user.email} ({dealer_user.role})")
    print(f"  Dealer 2: {dealer2_user.email} ({dealer2_user.role})")

    # -----------------------------------------------------------------
    # MODULE 1: COLLECTIONS & PAYMENTS
    # -----------------------------------------------------------------
    print("\n--- MODULE 1: Collections & Payments ---")
    ledger_view = LedgerEntryViewSet.as_view({'get': 'list', 'post': 'create'})
    wallet_view = WalletViewSet.as_view({'get': 'list', 'post': 'create'})

    import uuid
    # 1.1 Field Employee submits collection
    ref_code = f"UTR-STEP5-{uuid.uuid4().hex[:8].upper()}"
    post_data = {
        'dealer': str(dealer_user.id),
        'amount': '35000.00',
        'payment_method': 'UPI',
        'reference': ref_code,
        'notes': 'Advance harvest collection by Field Officer'
    }
    req = factory.post('/api/wallet/ledger/', post_data, format='json')
    force_authenticate(req, user=field_user)
    res = ledger_view(req)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.data}"
    created_entry_id = res.data['id']
    print(f"PASS: Field user successfully submitted collection: Amount INR 35,000, Reference: {ref_code}")

    # 1.2 Verify Wallet and Payment in DB
    dealer_wallet = Wallet.objects.get(dealer=dealer_user)
    assert Payment.objects.filter(ledger_entry_id=created_entry_id).exists(), "Payment details must be created"
    payment_rec = Payment.objects.get(ledger_entry_id=created_entry_id)
    assert payment_rec.method == 'UPI'
    assert payment_rec.status == 'Completed'
    print(f"PASS: Payment details correctly linked (Method: {payment_rec.method}, Status: {payment_rec.status}).")

    # 1.3 Test Invalid Input (Negative amount, missing amount)
    req_bad = factory.post('/api/wallet/ledger/', {
        'dealer': str(dealer_user.id),
        'amount': '-500',
        'payment_method': 'Cash'
    }, format='json')
    force_authenticate(req_bad, user=field_user)
    res_bad = ledger_view(req_bad)
    assert res_bad.status_code == 400, f"Expected 400 for negative amount, got {res_bad.status_code}"
    print("PASS: Negative amount correctly rejected (400 Bad Request).")

    req_zero = factory.post('/api/wallet/ledger/', {
        'dealer': str(dealer_user.id),
        'amount': '0',
        'payment_method': 'Cash'
    }, format='json')
    force_authenticate(req_zero, user=field_user)
    res_zero = ledger_view(req_zero)
    assert res_zero.status_code == 400, f"Expected 400 for zero amount, got {res_zero.status_code}"
    print("PASS: Zero amount correctly rejected (400 Bad Request).")

    # 1.4 Test Duplicate Reference Submission
    req_dup = factory.post('/api/wallet/ledger/', post_data, format='json')
    force_authenticate(req_dup, user=field_user)
    res_dup = ledger_view(req_dup)
    assert res_dup.status_code == 400, f"Expected 400 for duplicate reference, got {res_dup.status_code}"
    print("PASS: Duplicate transaction reference correctly rejected (400 Bad Request).")

    # 1.5 Permission test: Unauthorized role (Dealer) submitting collection
    req_dealer = factory.post('/api/wallet/ledger/', {
        'dealer': str(dealer_user.id),
        'amount': '1000',
        'payment_method': 'Cash'
    }, format='json')
    force_authenticate(req_dealer, user=dealer_user)
    res_dealer = ledger_view(req_dealer)
    assert res_dealer.status_code == 403, f"Expected 403 for dealer collection submission, got {res_dealer.status_code}"
    print("PASS: Dealer cannot submit collections (403 Forbidden).")

    # 1.6 Permission test: Unauthorized role (Warehouse) submitting collection
    req_wh = factory.post('/api/wallet/ledger/', {
        'dealer': str(dealer_user.id),
        'amount': '1000',
        'payment_method': 'Cash'
    }, format='json')
    force_authenticate(req_wh, user=wh_user)
    res_wh = ledger_view(req_wh)
    assert res_wh.status_code == 403, f"Expected 403 for warehouse collection submission, got {res_wh.status_code}"
    print("PASS: Warehouse cannot submit collections (403 Forbidden).")

    # -----------------------------------------------------------------
    # MODULE 2: DEALER PAYMENTS & DATA ISOLATION
    # -----------------------------------------------------------------
    print("\n--- MODULE 2: Dealer Payments & Data Isolation ---")
    
    # 2.1 Dealer 1 queries their ledger
    req_d1 = factory.get('/api/wallet/ledger/')
    force_authenticate(req_d1, user=dealer_user)
    res_d1 = ledger_view(req_d1)
    assert res_d1.status_code == 200
    d1_entry_ids = [entry['id'] for entry in res_d1.data]
    assert created_entry_id in d1_entry_ids, "Dealer 1 must see their own payment collection"
    print(f"PASS: Dealer 1 sees their collection record ({len(res_d1.data)} entries in ledger).")

    # 2.2 Dealer 2 queries their ledger -> MUST NOT SEE Dealer 1's records
    req_d2 = factory.get('/api/wallet/ledger/')
    force_authenticate(req_d2, user=dealer2_user)
    res_d2 = ledger_view(req_d2)
    assert res_d2.status_code == 200
    d2_entry_ids = [entry['id'] for entry in res_d2.data]
    assert created_entry_id not in d2_entry_ids, "Dealer 2 MUST NOT see Dealer 1's collections (Isolation Violation!)"
    print("PASS: Strict data isolation verified (Dealer 2 cannot see Dealer 1's payment records).")

    # 2.3 Dealer 1 checks personal wallet summary
    my_wallet_view = WalletViewSet.as_view({'get': 'my_wallet'})
    req_mw = factory.get('/api/wallet/wallets/my_wallet/')
    force_authenticate(req_mw, user=dealer_user)
    res_mw = my_wallet_view(req_mw)
    assert res_mw.status_code == 200
    assert 'outstanding_amount' in res_mw.data
    print(f"PASS: Dealer 1 personal wallet summary: Outstanding = {res_mw.data['outstanding_amount']}")

    # 2.4 Admin sees all collections
    req_admin = factory.get('/api/wallet/ledger/')
    force_authenticate(req_admin, user=admin_user)
    res_admin = ledger_view(req_admin)
    assert res_admin.status_code == 200
    admin_entry_ids = [entry['id'] for entry in res_admin.data]
    assert created_entry_id in admin_entry_ids
    print(f"PASS: Admin sees all company-wide ledger records ({len(res_admin.data)} records).")

    # -----------------------------------------------------------------
    # MODULE 3: WAREHOUSE STOCK MOVEMENTS & INVENTORY
    # -----------------------------------------------------------------
    print("\n--- MODULE 3: Warehouse Stock Movement & Inventory ---")
    stock_view = StockLedgerViewSet.as_view({
        'get': 'list',
        'post': 'create'
    })
    current_stock_view = StockLedgerViewSet.as_view({'get': 'current_stock'})
    product = Product.objects.first()
    assert product, "Product must exist"
    initial_stock = product.stock

    # 3.1 Warehouse checks current stock
    req_cs = factory.get('/api/inventory/stock/current_stock/')
    force_authenticate(req_cs, user=wh_user)
    res_cs = current_stock_view(req_cs)
    assert res_cs.status_code == 200, f"Expected 200, got {res_cs.status_code}"
    prod_entry = next(p for p in res_cs.data if p['id'] == str(product.id))
    assert prod_entry['stock'] == initial_stock
    print(f"PASS: Warehouse queries live current stock: {product.name} = {initial_stock} units.")

    # 3.2 Warehouse records Purchase (+50 units)
    po_ref = f"PO-STEP5-{uuid.uuid4().hex[:6].upper()}"
    dmg_ref = f"DMG-STEP5-{uuid.uuid4().hex[:6].upper()}"
    req_purchase = factory.post('/api/inventory/stock/', {
        'product': str(product.id),
        'type': 'Purchase',
        'quantity': 50,
        'reference': po_ref,
        'remarks': 'Factory delivery batch 1'
    }, format='json')
    force_authenticate(req_purchase, user=wh_user)
    res_purchase = stock_view(req_purchase)
    assert res_purchase.status_code == 201, f"Expected 201, got {res_purchase.status_code}: {res_purchase.data}"
    product.refresh_from_db()
    assert product.stock == initial_stock + 50, f"Expected {initial_stock + 50}, got {product.stock}"
    print(f"PASS: Purchase recorded (+50). Product stock updated from {initial_stock} -> {product.stock}.")

    # 3.3 Warehouse records Damage (-10 units)
    stock_before_damage = product.stock
    req_damage = factory.post('/api/inventory/stock/', {
        'product': str(product.id),
        'type': 'Damage',
        'quantity': 10,
        'reference': dmg_ref,
        'remarks': 'Damaged seal during transport'
    }, format='json')
    force_authenticate(req_damage, user=wh_user)
    res_damage = stock_view(req_damage)
    assert res_damage.status_code == 201, f"Expected 201, got {res_damage.status_code}: {res_damage.data}"
    product.refresh_from_db()
    assert product.stock == stock_before_damage - 10, f"Expected {stock_before_damage - 10}, got {product.stock}"
    print(f"PASS: Damage recorded (-10). Product stock updated from {stock_before_damage} -> {product.stock}.")

    # 3.4 Test Invalid Quantity (<= 0)
    req_invalid_qty = factory.post('/api/inventory/stock/', {
        'product': str(product.id),
        'type': 'Purchase',
        'quantity': -5
    }, format='json')
    force_authenticate(req_invalid_qty, user=wh_user)
    res_invalid_qty = stock_view(req_invalid_qty)
    assert res_invalid_qty.status_code == 400
    print("PASS: Negative quantity correctly rejected (400 Bad Request).")

    # 3.5 Test Excessive Stock Deduction (more than available)
    excess_qty = product.stock + 1000
    req_excess = factory.post('/api/inventory/stock/', {
        'product': str(product.id),
        'type': 'Damage',
        'quantity': excess_qty
    }, format='json')
    force_authenticate(req_excess, user=wh_user)
    res_excess = stock_view(req_excess)
    assert res_excess.status_code == 400
    print(f"PASS: Excessive deduction ({excess_qty} units when {product.stock} available) correctly rejected (400 Bad Request).")

    # 3.6 Permission Test: Unauthorized role (Dealer) recording stock movement
    req_dealer_stock = factory.post('/api/inventory/stock/', {
        'product': str(product.id),
        'type': 'Purchase',
        'quantity': 10
    }, format='json')
    force_authenticate(req_dealer_stock, user=dealer_user)
    res_dealer_stock = stock_view(req_dealer_stock)
    assert res_dealer_stock.status_code == 403, f"Expected 403 for dealer stock movement, got {res_dealer_stock.status_code}"
    print("PASS: Dealer cannot record warehouse stock movements (403 Forbidden).")

    # 3.7 Permission Test: Unauthorized role (Distributor/Employee) recording stock movement
    req_field_stock = factory.post('/api/inventory/stock/', {
        'product': str(product.id),
        'type': 'Purchase',
        'quantity': 10
    }, format='json')
    force_authenticate(req_field_stock, user=field_user)
    res_field_stock = stock_view(req_field_stock)
    assert res_field_stock.status_code == 403, f"Expected 403 for field staff stock movement, got {res_field_stock.status_code}"
    print("PASS: Field Employee cannot record warehouse stock movements (403 Forbidden).")

    # -----------------------------------------------------------------
    # MODULE 4: DATABASE PERSISTENCE CHECK (Direct SQLite ORM Query)
    # -----------------------------------------------------------------
    print("\n--- MODULE 4: SQLite Database Persistence Check ---")
    persisted_entry = LedgerEntry.objects.get(id=created_entry_id)
    assert persisted_entry.amount == Decimal('35000.00')
    assert persisted_entry.reference == ref_code
    assert persisted_entry.wallet.dealer.id == dealer_user.id
    assert persisted_entry.created_by.id == field_user.id

    persisted_payment = Payment.objects.get(ledger_entry=persisted_entry)
    assert persisted_payment.method == 'UPI'
    assert persisted_payment.status == 'Completed'

    persisted_stock_entry = StockLedger.objects.filter(reference=po_ref).first()
    assert persisted_stock_entry is not None
    assert persisted_stock_entry.quantity == 50
    assert persisted_stock_entry.type == 'Purchase'

    persisted_damage_entry = StockLedger.objects.filter(reference=dmg_ref).first()
    assert persisted_damage_entry is not None
    assert persisted_damage_entry.quantity == 10
    assert persisted_damage_entry.type == 'Damage'

    print("PASS: All wallet, ledger, payment, and stock movements 100% verified in SQLite database.")

    print("\n================================================================")
    print("ALL STEP 5 TESTS PASSED WITH 100% SUCCESS!")
    print("================================================================")

if __name__ == '__main__':
    run_tests()
