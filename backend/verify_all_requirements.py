import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccs_backend.settings')
django.setup()

from decimal import Decimal
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole, UserStatus, DealerProfile, DistributorProfile
from apps.products.models import Product, Category, Brand
from apps.orders.models import Order, OrderItem, OrderStatus, PaymentStatus

def run_comprehensive_audit():
    print("==================================================================")
    print("RUNNING COMPREHENSIVE REQUIREMENTS AUDIT (PAGES 1-5)")
    print("==================================================================")

    # 1. Setup Test Users
    admin_user, _ = User.objects.get_or_create(
        email='admin_audit@ccs.com',
        defaults={'username': 'admin_audit', 'role': UserRole.ADMIN, 'status': UserStatus.APPROVED, 'is_verified': True}
    )
    admin_user.set_password('AdminPass123!')
    admin_user.save()

    emp_user, _ = User.objects.get_or_create(
        email='emp_audit@ccs.com',
        defaults={'username': 'emp_audit', 'role': UserRole.DISTRIBUTOR, 'status': UserStatus.APPROVED, 'is_verified': True, 'first_name': 'Sales', 'last_name': 'Staff'}
    )
    emp_user.set_password('EmpPass123!')
    emp_user.save()

    dist_user, _ = User.objects.get_or_create(
        email='dist_audit@ccs.com',
        defaults={'username': 'dist_audit', 'role': UserRole.DEALER, 'status': UserStatus.APPROVED, 'is_verified': True, 'first_name': 'Kisan Kendra', 'last_name': 'Audit'}
    )
    dist_user.set_password('DistPass123!')
    dist_user.save()
    DealerProfile.objects.get_or_create(user=dist_user, defaults={'company_name': 'Kisan Kendra Audit', 'city': 'Nashik'})

    wh_user, _ = User.objects.get_or_create(
        email='wh_audit@ccs.com',
        defaults={'username': 'wh_audit', 'role': UserRole.WAREHOUSE, 'status': UserStatus.APPROVED, 'is_verified': True, 'first_name': 'Warehouse', 'last_name': 'Officer'}
    )
    wh_user.set_password('WhPass123!')
    wh_user.save()

    unrelated_emp, _ = User.objects.get_or_create(
        email='unrelated_emp_audit@ccs.com',
        defaults={'username': 'unrelated_emp_audit', 'role': UserRole.DISTRIBUTOR, 'status': UserStatus.APPROVED, 'is_verified': True}
    )
    unrelated_emp.set_password('EmpPass123!')
    unrelated_emp.save()

    # 2. Setup Test Product
    brand, _ = Brand.objects.get_or_create(name='Chitra Crop Science')
    cat, _ = Category.objects.get_or_create(name='Bio Products')
    product, _ = Product.objects.get_or_create(
        name='Chitra Audit Bio-Shield 1L',
        defaults={
            'brand': brand,
            'category': cat,
            'technical_name': 'Bio Complex 90%',
            'mrp': Decimal('1450.00'),
            'dealer_price': Decimal('1000.00'),
            'packing': '1 Ltr Bottle',
            'pack_size': '1 Ltr',
            'stock': 500,
            'status': 'Active'
        }
    )

    client = APIClient()

    # ------------------------------------------------------------------
    # SCENARIO 1: Normal Order -> Approved -> Bilty -> Ready -> Dispatched
    # ------------------------------------------------------------------
    print("\n--- SCENARIO 1: Full Happy Path (Create -> Approve -> Bilty -> RTD -> Dispatched) ---")
    client.force_authenticate(user=emp_user)
    create_payload = {
        'dealer': str(dist_user.id),
        'payment_terms': 'Cash (15 Days)',
        'remarks': 'Scenario 1 Normal Order',
        'items': [
            {
                'product': str(product.id),
                'quantity': 5,
                'rate': 1000.00
            }
        ]
    }
    res_c = client.post('/api/orders/', create_payload, format='json')
    assert res_c.status_code == 201, f"Failed to create order: {res_c.data}"
    ord_id = res_c.data['id']
    ord_obj = Order.objects.get(id=ord_id)
    
    # Page 1 checks:
    assert ord_obj.dealer == dist_user, "Distributor selection mapped correctly"
    assert ord_obj.status == OrderStatus.PENDING_APPROVAL, "Order initial status is Pending Approval"
    assert float(ord_obj.subtotal) == 5000.00, f"Expected 5000 subtotal, got {ord_obj.subtotal}"
    assert float(ord_obj.gst_total) == 900.00, f"Expected 900 GST, got {ord_obj.gst_total}"
    assert float(ord_obj.grand_total) == 5900.00, f"Expected 5900 grand total, got {ord_obj.grand_total}"
    item_obj = ord_obj.items.first()
    assert item_obj.product == product
    assert item_obj.quantity == 5
    assert float(item_obj.rate) == 1000.00
    print("[PASS] Page 1: Order created with accurate distributor, product, 1L packaging, rate, 18% GST calculation, and DB persistence.")

    # Admin reviews and approves
    client.force_authenticate(user=admin_user)
    res_app = client.post(f'/api/orders/{ord_id}/approve/', {}, format='json')
    assert res_app.status_code == 200
    ord_obj.refresh_from_db()
    assert ord_obj.status == OrderStatus.APPROVED
    print("[PASS] Page 2: Admin approves order successfully.")

    # Admin uploads Bilty
    res_bilty = client.post(f'/api/orders/{ord_id}/upload_bilty/', {'bilty_number': 'BLT-SC1-9988'}, format='json')
    assert res_bilty.status_code == 200
    ord_obj.refresh_from_db()
    assert ord_obj.status == OrderStatus.BILTY_UPLOADED
    assert ord_obj.bilty_number == 'BLT-SC1-9988'
    print("[PASS] Page 2: Admin uploads Bilty (BLT-SC1-9988), correctly associated and stored in DB.")

    # Admin marks Ready to Dispatch
    res_rtd = client.post(f'/api/orders/{ord_id}/mark_ready_dispatch/', {}, format='json')
    assert res_rtd.status_code == 200
    ord_obj.refresh_from_db()
    assert ord_obj.status == OrderStatus.READY_DISPATCH
    print("[PASS] Page 2: Admin transitions order to 'Ready to Dispatch' for Warehouse queue.")

    # Warehouse receives in queue and generates LR
    client.force_authenticate(user=wh_user)
    wh_orders = client.get('/api/orders/').data
    assert any(o['id'] == ord_id for o in wh_orders), "Approved & ready order must be visible to Warehouse"
    
    res_lr = client.post(f'/api/orders/{ord_id}/generate_lr/', {
        'lr_number': 'LR-SC1-4455',
        'transport_details': 'Kisan Express Cargo',
        'vehicle_number': 'MH-15-AB-1234'
    }, format='json')
    assert res_lr.status_code == 200
    ord_obj.refresh_from_db()
    assert ord_obj.status == OrderStatus.DISPATCHED
    assert ord_obj.lr_number == 'LR-SC1-4455'
    assert ord_obj.transport_details == 'Kisan Express Cargo'
    assert ord_obj.vehicle_number == 'MH-15-AB-1234'
    print("[PASS] Page 3: Warehouse generates genuine LR, vehicle & transport details, and order is Dispatched.")

    # Visibility checks across roles
    # 1. Admin
    client.force_authenticate(user=admin_user)
    admin_get = client.get(f'/api/orders/{ord_id}/').data
    assert admin_get['bilty_number'] == 'BLT-SC1-9988'
    assert admin_get['lr_number'] == 'LR-SC1-4455'
    assert admin_get['items'][0]['product_name'] == 'Chitra Audit Bio-Shield 1L'
    assert admin_get['items'][0]['pack_size'] == '1 Ltr'

    # 2. Employee (Creator)
    client.force_authenticate(user=emp_user)
    emp_get = client.get(f'/api/orders/{ord_id}/').data
    assert emp_get['bilty_number'] == 'BLT-SC1-9988'
    assert emp_get['lr_number'] == 'LR-SC1-4455'
    assert emp_get['items'][0]['product_name'] == 'Chitra Audit Bio-Shield 1L'

    # 3. Distributor (Recipient)
    client.force_authenticate(user=dist_user)
    dist_get = client.get(f'/api/orders/{ord_id}/').data
    assert dist_get['bilty_number'] == 'BLT-SC1-9988'
    assert dist_get['lr_number'] == 'LR-SC1-4455'
    print("[PASS] Page 4: Full document visibility verified across Admin, Creator Employee, and Recipient Distributor.")

    # ------------------------------------------------------------------
    # SCENARIO 2: Rejection Flow
    # ------------------------------------------------------------------
    print("\n--- SCENARIO 2: Order Rejection Flow ---")
    client.force_authenticate(user=emp_user)
    res_c2 = client.post('/api/orders/', create_payload, format='json')
    ord2_id = res_c2.data['id']
    
    client.force_authenticate(user=admin_user)
    res_rej = client.post(f'/api/orders/{ord2_id}/reject/', {'remarks': 'Credit limit exceeded'}, format='json')
    assert res_rej.status_code == 200
    ord2_obj = Order.objects.get(id=ord2_id)
    assert ord2_obj.status == OrderStatus.REJECTED
    print("[PASS] Scenario 2: Admin rejection successfully recorded and persisted.")

    # ------------------------------------------------------------------
    # SCENARIO 3: Order Approved but not processed by Warehouse
    # ------------------------------------------------------------------
    print("\n--- SCENARIO 3: Approved but not yet processed by Warehouse ---")
    client.force_authenticate(user=emp_user)
    res_c3 = client.post('/api/orders/', create_payload, format='json')
    ord3_id = res_c3.data['id']
    client.force_authenticate(user=admin_user)
    client.post(f'/api/orders/{ord3_id}/approve/', {}, format='json')
    ord3_obj = Order.objects.get(id=ord3_id)
    assert ord3_obj.status == OrderStatus.APPROVED
    assert ord3_obj.bilty_number is None
    assert ord3_obj.lr_number is None
    print("[PASS] Scenario 3: Order approved but pending Bilty and Warehouse dispatch verified.")

    # ------------------------------------------------------------------
    # SCENARIO 4: Order with Bilty generated but no LR yet
    # ------------------------------------------------------------------
    print("\n--- SCENARIO 4: Bilty generated but no LR yet ---")
    client.post(f'/api/orders/{ord3_id}/upload_bilty/', {'bilty_number': 'BLT-SC4-ONLY'}, format='json')
    ord3_obj.refresh_from_db()
    assert ord3_obj.status == OrderStatus.BILTY_UPLOADED
    assert ord3_obj.bilty_number == 'BLT-SC4-ONLY'
    assert ord3_obj.lr_number is None
    print("[PASS] Scenario 4: Order with Bilty generated but no LR yet verified.")

    # ------------------------------------------------------------------
    # SCENARIO 5: Order Ready to Dispatch but LR not generated yet
    # ------------------------------------------------------------------
    print("\n--- SCENARIO 5: Ready to Dispatch but LR not generated yet ---")
    client.post(f'/api/orders/{ord3_id}/mark_ready_dispatch/', {}, format='json')
    ord3_obj.refresh_from_db()
    assert ord3_obj.status == OrderStatus.READY_DISPATCH
    assert ord3_obj.lr_number is None
    print("[PASS] Scenario 5: Order marked Ready to Dispatch, awaiting LR in Warehouse queue.")

    # ------------------------------------------------------------------
    # SCENARIO 6: Security & Role Permission Boundaries
    # ------------------------------------------------------------------
    print("\n--- SCENARIO 6: Negative & Permission Boundaries ---")
    
    # Negative 1: Warehouse cannot approve orders
    client.force_authenticate(user=wh_user)
    res_wh_app = client.post(f'/api/orders/{ord_id}/approve/', {}, format='json')
    assert res_wh_app.status_code == 403, f"Warehouse must get 403 on approve, got {res_wh_app.status_code}"
    print("[PASS] Security: Warehouse cannot approve orders (HTTP 403 Forbidden).")

    # Negative 2: Warehouse cannot reject orders
    res_wh_rej = client.post(f'/api/orders/{ord_id}/reject/', {}, format='json')
    assert res_wh_rej.status_code == 403
    print("[PASS] Security: Warehouse cannot reject orders (HTTP 403 Forbidden).")

    # Negative 3: Warehouse cannot upload Bilty
    res_wh_blt = client.post(f'/api/orders/{ord_id}/upload_bilty/', {'bilty_number': 'BLT-HACK'}, format='json')
    assert res_wh_blt.status_code == 403
    print("[PASS] Security: Warehouse cannot upload Bilty (HTTP 403 Forbidden).")

    # Negative 4: Warehouse cannot generate LR before Ready to Dispatch
    res_wh_lr_premature = client.post(f'/api/orders/{ord2_id}/generate_lr/', {'lr_number': 'LR-PREMATURE'}, format='json')
    assert res_wh_lr_premature.status_code == 400
    print("[PASS] Security: Warehouse cannot generate LR if order is not Ready to Dispatch (HTTP 400 Bad Request).")

    # Negative 5: Employee cannot approve orders
    client.force_authenticate(user=emp_user)
    res_emp_app = client.post(f'/api/orders/{ord_id}/approve/', {}, format='json')
    assert res_emp_app.status_code == 403
    print("[PASS] Security: Employee cannot approve orders (HTTP 403 Forbidden).")

    # Negative 6: Employee cannot upload Bilty
    res_emp_blt = client.post(f'/api/orders/{ord_id}/upload_bilty/', {'bilty_number': 'BLT-EMP'}, format='json')
    assert res_emp_blt.status_code == 403
    print("[PASS] Security: Employee cannot upload Bilty (HTTP 403 Forbidden).")

    # Negative 7: Unrelated employee cannot access other employee's order
    client.force_authenticate(user=unrelated_emp)
    unrelated_orders = client.get('/api/orders/').data
    assert not any(o['id'] == ord_id for o in unrelated_orders)
    print("[PASS] Security: Unrelated employee cannot access or view other employee's orders (isolated queryset).")

    print("\n==================================================================")
    print("ALL AUDIT SCENARIOS PASSED 100% WITH DATABASE & PERMISSION EVIDENCE!")
    print("==================================================================")

if __name__ == '__main__':
    run_comprehensive_audit()
