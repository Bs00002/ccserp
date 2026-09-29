import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccs_backend.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
django.setup()

from apps.accounts.models import User, UserRole
from apps.products.models import Product
from apps.orders.models import Order, OrderStatus
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.orders.views import OrderViewSet

def test_full_workflow():
    factory = APIRequestFactory()
    view = OrderViewSet.as_view({
        'get': 'list',
        'post': 'create'
    })
    
    # 1. Setup users
    admin_user = User.objects.filter(role__in=[UserRole.SUPER_ADMIN, UserRole.ADMIN]).first()
    emp_user = User.objects.filter(role=UserRole.DISTRIBUTOR).first() or User.objects.filter(email='master_emp@ccs.com').first()
    wh_user = User.objects.filter(role=UserRole.WAREHOUSE).first() or User.objects.filter(email='master_wh@ccs.com').first()
    dealer_user = User.objects.filter(role=UserRole.DEALER).first()
    product = Product.objects.first()

    assert admin_user is not None, "Admin user required"
    assert emp_user is not None, "Employee user required"
    assert wh_user is not None, "Warehouse user required"
    assert dealer_user is not None, "Dealer user required"
    assert product is not None, "Product required"

    # Ensure product stock is sufficient
    product.stock = 500
    product.save()

    print(f"Users ready:")
    print(f"  Admin: {admin_user.email} (Role: {admin_user.role})")
    print(f"  Employee: {emp_user.email} (Role: {emp_user.role})")
    print(f"  Warehouse: {wh_user.email} (Role: {wh_user.role})")
    print(f"  Dealer: {dealer_user.email} (Role: {dealer_user.role})")

    # STEP 1: Employee creates test order
    print("\n--- STEP 1: Employee Creates Order ---")
    order_data = {
        'dealer': str(dealer_user.id),
        'payment_terms': 'Cash (15 Days)',
        'remarks': 'Fast-track test order',
        'items': [
            {'product': str(product.id), 'quantity': 5}
        ]
    }
    req = factory.post('/api/orders/', order_data, format='json')
    force_authenticate(req, user=emp_user)
    res = view(req)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.data}"
    order_id = res.data['id']
    order = Order.objects.get(id=order_id)
    assert order.status == OrderStatus.PENDING_APPROVAL, f"Expected Pending Approval, got {order.status}"
    print(f"PASS: Order created: {order.order_number}, Status: {order.status}")

    # STEP 2: Admin sees order
    print("\n--- STEP 2: Admin Sees Order ---")
    req = factory.get('/api/orders/')
    force_authenticate(req, user=admin_user)
    res = view(req)
    assert res.status_code == 200
    admin_order_ids = [o['id'] for o in res.data]
    assert order_id in admin_order_ids, "Admin must see created order"
    print(f"PASS: Admin successfully sees order in list.")

    # STEP 3: Permission Tests - Unauthorized Actions by Employee
    print("\n--- STEP 3: Permission Tests (Employee Unauthorized Actions) ---")
    detail_view = OrderViewSet.as_view({
        'post': 'approve'
    })
    req = factory.post(f'/api/orders/{order_id}/approve/')
    force_authenticate(req, user=emp_user)
    res = detail_view(req, pk=order_id)
    assert res.status_code == 403, f"Expected 403 for employee approve, got {res.status_code}"
    print("PASS: Employee cannot approve order (403 Forbidden).")

    bilty_view = OrderViewSet.as_view({'post': 'generate_bilty'})
    req = factory.post(f'/api/orders/{order_id}/generate_bilty/', {'bilty_number': 'FAKE-BILTY'})
    force_authenticate(req, user=emp_user)
    res = bilty_view(req, pk=order_id)
    assert res.status_code == 403, f"Expected 403 for employee bilty, got {res.status_code}"
    print("PASS: Employee cannot generate Bilty (403 Forbidden).")

    lr_view = OrderViewSet.as_view({'post': 'generate_lr'})
    req = factory.post(f'/api/orders/{order_id}/generate_lr/', {'lr_number': 'FAKE-LR'})
    force_authenticate(req, user=emp_user)
    res = lr_view(req, pk=order_id)
    assert res.status_code == 403, f"Expected 403 for employee LR, got {res.status_code}"
    print("PASS: Employee cannot generate LR (403 Forbidden).")

    dispatch_view = OrderViewSet.as_view({'post': 'dispatch_order'})
    req = factory.post(f'/api/orders/{order_id}/dispatch_order/', {})
    force_authenticate(req, user=emp_user)
    res = dispatch_view(req, pk=order_id)
    assert res.status_code == 403, f"Expected 403 for employee dispatch, got {res.status_code}"
    print("PASS: Employee cannot dispatch order (403 Forbidden).")

    # STEP 4: Permission Tests - Unauthorized Actions by Warehouse
    print("\n--- STEP 4: Permission Tests (Warehouse Unauthorized Actions) ---")
    req = factory.post(f'/api/orders/{order_id}/approve/')
    force_authenticate(req, user=wh_user)
    res = detail_view(req, pk=order_id)
    assert res.status_code == 403, f"Expected 403 for warehouse approve, got {res.status_code}"
    print("PASS: Warehouse cannot approve order (403 Forbidden).")

    req = factory.post(f'/api/orders/{order_id}/generate_bilty/', {'bilty_number': 'FAKE-BILTY'})
    force_authenticate(req, user=wh_user)
    res = bilty_view(req, pk=order_id)
    assert res.status_code == 403, f"Expected 403 for warehouse bilty, got {res.status_code}"
    print("PASS: Warehouse cannot generate/modify Bilty (403 Forbidden).")

    # STEP 5: Admin Approves Order
    print("\n--- STEP 5: Admin Reviews & Approves Order ---")
    req = factory.post(f'/api/orders/{order_id}/approve/')
    force_authenticate(req, user=admin_user)
    res = detail_view(req, pk=order_id)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.data}"
    order.refresh_from_db()
    assert order.status == OrderStatus.APPROVED, f"Expected Approved, got {order.status}"
    print(f"PASS: Admin approved order. Status: {order.status}")

    # STEP 6: Admin Generates Bilty -> Order becomes Ready to Dispatch
    print("\n--- STEP 6: Admin Generates Bilty ---")
    req = factory.post(f'/api/orders/{order_id}/generate_bilty/', {'bilty_number': f'BILTY-{order.order_number}'})
    force_authenticate(req, user=admin_user)
    res = bilty_view(req, pk=order_id)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.data}"
    order.refresh_from_db()
    assert order.status == OrderStatus.READY_DISPATCH, f"Expected Ready to Dispatch, got {order.status}"
    assert order.bilty_number == f'BILTY-{order.order_number}'
    assert order.bilty_uploaded_by == admin_user
    print(f"PASS: Bilty generated ({order.bilty_number}). Order status transitioned to: {order.status}")

    # STEP 7: Warehouse Sees Ready to Dispatch Order & Bilty
    print("\n--- STEP 7: Warehouse Sees Ready to Dispatch Order & Bilty ---")
    req = factory.get('/api/orders/')
    force_authenticate(req, user=wh_user)
    res = view(req)
    assert res.status_code == 200
    wh_order_ids = [o['id'] for o in res.data]
    assert order_id in wh_order_ids, "Warehouse must see Ready to Dispatch order"
    wh_order_item = next(o for o in res.data if o['id'] == order_id)
    assert wh_order_item['status'] == OrderStatus.READY_DISPATCH
    assert wh_order_item['bilty_number'] == f'BILTY-{order.order_number}'
    print(f"PASS: Warehouse correctly sees order with Bilty: {wh_order_item['bilty_number']}")

    # STEP 8: Warehouse Generates LR -> CRITICAL: Must NOT Automatically Dispatch!
    print("\n--- STEP 8: Warehouse Generates LR (Verify NO Auto-Dispatch) ---")
    lr_data = {
        'lr_number': f'LR-{order.order_number}',
        'transport_details': 'VRL Freight Carriers',
        'vehicle_number': 'MH-12-PQ-9988'
    }
    req = factory.post(f'/api/orders/{order_id}/generate_lr/', lr_data)
    force_authenticate(req, user=wh_user)
    res = lr_view(req, pk=order_id)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.data}"
    order.refresh_from_db()
    
    # CRITICAL CHECK: LR creation/upload MUST NOT automatically dispatch the order.
    assert order.status == OrderStatus.READY_DISPATCH, f"CRITICAL FAILURE: Order was auto-dispatched! Status is {order.status}"
    assert order.lr_number == f'LR-{order.order_number}'
    assert order.transport_details == 'VRL Freight Carriers'
    assert order.vehicle_number == 'MH-12-PQ-9988'
    assert order.lr_generated_by == wh_user
    print(f"PASS: LR Generated ({order.lr_number}). Status is STILL '{order.status}' (NOT auto-dispatched).")

    # STEP 9: Warehouse Performs Authorized Dispatch -> Status becomes Dispatched
    print("\n--- STEP 9: Warehouse Performs Authorized Dispatch ---")
    req = factory.post(f'/api/orders/{order_id}/dispatch_order/', {})
    force_authenticate(req, user=wh_user)
    res = dispatch_view(req, pk=order_id)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.data}"
    order.refresh_from_db()
    assert order.status == OrderStatus.DISPATCHED, f"Expected Dispatched, got {order.status}"
    print(f"PASS: Authorized Dispatch performed! Status transitioned to: {order.status}")

    # STEP 10: Admin Sees Updated Dispatched Status & LR
    print("\n--- STEP 10: Admin Sees Updated Status ---")
    req = factory.get('/api/orders/')
    force_authenticate(req, user=admin_user)
    res = view(req)
    admin_order = next(o for o in res.data if o['id'] == order_id)
    assert admin_order['status'] == OrderStatus.DISPATCHED
    assert admin_order['lr_number'] == f'LR-{order.order_number}'
    print(f"PASS: Admin sees status '{admin_order['status']}' and LR '{admin_order['lr_number']}'.")

    # STEP 11: Employee Sees Correct Order & LR Status
    print("\n--- STEP 11: Employee Sees Correct Order & LR Status ---")
    req = factory.get('/api/orders/')
    force_authenticate(req, user=emp_user)
    res = view(req)
    emp_order = next(o for o in res.data if o['id'] == order_id)
    assert emp_order['status'] == OrderStatus.DISPATCHED
    assert emp_order['lr_number'] == f'LR-{order.order_number}'
    assert emp_order['bilty_number'] == f'BILTY-{order.order_number}'
    print(f"PASS: Employee sees order '{emp_order['order_number']}' with LR '{emp_order['lr_number']}' and status '{emp_order['status']}'.")

    # STEP 12: Database Persistence Verification (SQLite direct read)
    print("\n--- STEP 12: SQLite Database Persistence Check ---")
    saved_order = Order.objects.get(id=order_id)
    assert saved_order.status == OrderStatus.DISPATCHED
    assert saved_order.bilty_number == f'BILTY-{saved_order.order_number}'
    assert saved_order.lr_number == f'LR-{saved_order.order_number}'
    assert saved_order.transport_details == 'VRL Freight Carriers'
    assert saved_order.vehicle_number == 'MH-12-PQ-9988'
    assert saved_order.bilty_uploaded_by.id == admin_user.id
    assert saved_order.lr_generated_by.id == wh_user.id
    timeline_entries = list(saved_order.timeline.all().order_by('timestamp'))
    print(f"Timeline entries count: {len(timeline_entries)}")
    for t in timeline_entries:
        print(f"  [{t.timestamp}] {t.status}: {t.remarks} (by {t.created_by})")
    assert len(timeline_entries) >= 4, "Timeline must record Approval, Bilty, LR, and Dispatch"
    print("PASS: All order, bilty, LR, and timeline data 100% persisted to SQLite.")

    print("\n========================================================")
    print("ALL WORKFLOW & PERMISSION TESTS PASSED PERFECTLY!")
    print("========================================================")

if __name__ == '__main__':
    test_full_workflow()
