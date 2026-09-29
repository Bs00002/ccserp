import os
import django
import sys
import uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccs_backend.settings')
django.setup()

from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole, UserStatus, DistributorProfile, DealerProfile
from apps.products.models import Product, Category, Brand
from apps.orders.models import Order, OrderItem, OrderStatus, PaymentStatus

def run_tests():
    print("==================================================")
    print("STARTING FULL WAREHOUSE WORKFLOW & NEGATIVE TESTS")
    print("==================================================")

    # 1. Setup Test Users
    admin_user, _ = User.objects.get_or_create(
        email='admin_workflow_test@ccs.com',
        defaults={'username': 'admin_workflow', 'role': UserRole.ADMIN, 'status': UserStatus.APPROVED, 'is_verified': True}
    )
    admin_user.set_password('AdminPass123!')
    admin_user.save()

    emp_user, _ = User.objects.get_or_create(
        email='employee_workflow_test@ccs.com',
        defaults={'username': 'emp_workflow', 'role': UserRole.DISTRIBUTOR, 'status': UserStatus.APPROVED, 'is_verified': True, 'first_name': 'Workflow Test', 'last_name': 'Employee'}
    )
    emp_user.set_password('EmpPass123!')
    emp_user.save()

    dist_user, _ = User.objects.get_or_create(
        email='distributor_workflow_test@ccs.com',
        defaults={'username': 'dist_workflow', 'role': UserRole.DEALER, 'status': UserStatus.APPROVED, 'is_verified': True, 'first_name': 'Kisan Agrotech', 'last_name': 'Test Kendra'}
    )
    dist_user.set_password('DistPass123!')
    dist_user.save()
    DealerProfile.objects.get_or_create(user=dist_user, defaults={'company_name': 'Kisan Agrotech Test Kendra', 'city': 'Pune'})

    wh_user, _ = User.objects.get_or_create(
        email='warehouse@ccs.com',
        defaults={'username': 'warehouse_user', 'role': UserRole.WAREHOUSE, 'status': UserStatus.APPROVED, 'is_verified': True, 'first_name': 'Warehouse', 'last_name': 'Officer'}
    )
    wh_user.set_password('Ccs@12345')
    wh_user.save()

    unrelated_emp, _ = User.objects.get_or_create(
        email='unrelated_emp@ccs.com',
        defaults={'username': 'unrelated_emp', 'role': UserRole.DISTRIBUTOR, 'status': UserStatus.APPROVED, 'is_verified': True}
    )

    # 2. Setup Test Product
    brand, _ = Brand.objects.get_or_create(name='Chitra Crop Science')
    cat, _ = Category.objects.get_or_create(name='Bio Products')
    product, _ = Product.objects.get_or_create(
        name='Chitra Bio-Shield Max (Workflow Test SKU)',
        defaults={
            'brand': brand,
            'category': cat,
            'technical_name': 'Azotobacter & Bio-Protector Complex 90%',
            'mrp': 1450.00,
            'dealer_price': 1050.00,
            'packing': '1 Ltr Bottle',
            'stock': 500,
            'status': 'Active'
        }
    )

    client = APIClient()

    # ---------------------------------------------------------
    # TEST 1: Employee Creates Order
    # ---------------------------------------------------------
    client.force_authenticate(user=emp_user)
    payload = {
        'dealer': str(dist_user.id),
        'payment_terms': 'Cash (15 Days)',
        'remarks': 'Payment terms: Cash (15 Days). Test order',
        'items': [
            {
                'product': str(product.id),
                'quantity': 2,
                'rate': 1050.00
            }
        ]
    }
    response = client.post('/api/orders/', payload, format='json')
    assert response.status_code == 201, f"Create Order failed: {response.data}"
    order_id = response.data['id']
    order_obj = Order.objects.get(id=order_id)
    assert order_obj.status == OrderStatus.PENDING_APPROVAL
    assert float(order_obj.subtotal) == 2100.00
    assert float(order_obj.gst_total) == 378.00
    assert float(order_obj.grand_total) == 2478.00
    print("[OK] TEST 1 PASSED: Order created by Employee (ID: " + str(order_obj.order_number) + ", status: Pending Approval).")

    # ---------------------------------------------------------
    # TEST A (Negative): Warehouse tries Generate LR at Pending Approval -> Must FAIL (400)
    # ---------------------------------------------------------
    client.force_authenticate(user=wh_user)
    res_lr = client.post(f'/api/orders/{order_id}/generate_lr/', {'lr_number': 'LR-TEST-01'}, format='json')
    assert res_lr.status_code == 400, f"Expected 400 for LR at Pending Approval stage, got {res_lr.status_code}"
    print(f"[OK] TEST A PASSED: Locked LR rejection verified at Pending Approval ({res_lr.data['error']}).")

    # ---------------------------------------------------------
    # TEST 2: Admin Approves Order
    # ---------------------------------------------------------
    client.force_authenticate(user=admin_user)
    res_app = client.post(f'/api/orders/{order_id}/approve/', {}, format='json')
    assert res_app.status_code == 200, f"Approve failed: {res_app.data}"
    order_obj.refresh_from_db()
    assert order_obj.status == OrderStatus.APPROVED
    print("[OK] TEST 2 PASSED: Admin approved SAME Order ID (" + str(order_obj.order_number) + ").")

    # ---------------------------------------------------------
    # TEST B (Negative): Warehouse tries Generate LR at Approved -> Must FAIL (400)
    # ---------------------------------------------------------
    client.force_authenticate(user=wh_user)
    res_lr_b = client.post(f'/api/orders/{order_id}/generate_lr/', {'lr_number': 'LR-TEST-02'}, format='json')
    assert res_lr_b.status_code == 400
    print(f"[OK] TEST B PASSED: Locked LR rejection verified at Approved stage ({res_lr_b.data['error']}).")

    # ---------------------------------------------------------
    # TEST 3: Admin Uploads Office Bilty
    # ---------------------------------------------------------
    client.force_authenticate(user=admin_user)
    res_bilty = client.post(f'/api/orders/{order_id}/upload_bilty/', {'bilty_number': 'BILTY-001'}, format='json')
    assert res_bilty.status_code == 200
    order_obj.refresh_from_db()
    assert order_obj.status == OrderStatus.BILTY_UPLOADED
    print("[OK] TEST 3 PASSED: Admin uploaded Office Bilty 'BILTY-001'. Status: Bilty Uploaded.")

    # ---------------------------------------------------------
    # TEST D (Negative): Warehouse tries Generate LR at Bilty Uploaded -> Must FAIL (400)
    # ---------------------------------------------------------
    client.force_authenticate(user=wh_user)
    res_lr_d = client.post(f'/api/orders/{order_id}/generate_lr/', {'lr_number': 'LR-TEST-03'}, format='json')
    assert res_lr_d.status_code == 400
    print(f"[OK] TEST D PASSED: Locked LR rejection verified at Bilty Uploaded stage ({res_lr_d.data['error']}).")

    # ---------------------------------------------------------
    # TEST 4: Admin Marks Ready to Dispatch
    # ---------------------------------------------------------
    client.force_authenticate(user=admin_user)
    res_rtd = client.post(f'/api/orders/{order_id}/mark_ready_dispatch/', {}, format='json')
    assert res_rtd.status_code == 200
    order_obj.refresh_from_db()
    assert order_obj.status == OrderStatus.READY_DISPATCH
    print("[OK] TEST 4 PASSED: Order marked 'Ready to Dispatch'. Handed over to Warehouse queue.")

    # ---------------------------------------------------------
    # TEST 5: Warehouse User Receives SAME Order & Generates LR
    # ---------------------------------------------------------
    client.force_authenticate(user=wh_user)
    wh_qs = client.get('/api/orders/')
    assert any(o['id'] == order_id for o in wh_qs.data), "Warehouse MUST see order ready for dispatch."

    res_lr_ok = client.post(f'/api/orders/{order_id}/generate_lr/', {
        'lr_number': 'LR-TEST-001',
        'transport_details': 'Test Transporter',
        'vehicle_number': 'MH-12-PQ-9988'
    }, format='json')
    assert res_lr_ok.status_code == 200, f"LR Generation failed for Warehouse: {res_lr_ok.data}"
    order_obj.refresh_from_db()
    assert order_obj.status == OrderStatus.DISPATCHED
    assert order_obj.lr_number == 'LR-TEST-001'
    assert order_obj.vehicle_number == 'MH-12-PQ-9988'
    print("[OK] TEST 5 PASSED: Warehouse completed dispatch for SAME Order ID. Status: Dispatched (LR: LR-TEST-001, Transporter: Test Transporter, Vehicle: MH-12-PQ-9988).")

    # ---------------------------------------------------------
    # TEST 6: Check Order & LR Visibility across Admin, Creator Employee & Recipient Distributor
    # ---------------------------------------------------------
    # Admin View
    client.force_authenticate(user=admin_user)
    res_admin_view = client.get(f'/api/orders/{order_id}/')
    assert res_admin_view.data['lr_number'] == 'LR-TEST-001'

    # Creator Employee View
    client.force_authenticate(user=emp_user)
    res_emp_view = client.get(f'/api/orders/{order_id}/')
    assert res_emp_view.data['lr_number'] == 'LR-TEST-001'

    # Recipient Distributor View
    client.force_authenticate(user=dist_user)
    res_dist_view = client.get(f'/api/orders/{order_id}/')
    assert res_dist_view.data['lr_number'] == 'LR-TEST-001'

    # Unrelated Employee View -> Must return 404/Empty
    client.force_authenticate(user=unrelated_emp)
    unrelated_qs = client.get('/api/orders/')
    assert not any(o['id'] == order_id for o in unrelated_qs.data)
    print("[OK] TEST 6 PASSED: Verified LR & Bilty document visibility across Admin, Creator Employee, Recipient Distributor, and Warehouse (Unrelated employee blocked).")

    print("\n==================================================")
    print("ALL WAREHOUSE AUTOMATED TESTS PASSED 100%!")
    print("==================================================")

if __name__ == '__main__':
    run_tests()
