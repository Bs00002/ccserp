import os
import sys
import json
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccs_backend.settings')
django.setup()

from django.contrib.auth import authenticate
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole, UserStatus, DealerProfile, DistributorProfile, EmployeeProfile
from apps.products.models import Product, Category, Brand
from apps.orders.models import Order, OrderItem, OrderStatus, PaymentStatus, Invoice

def run_tests():
    print("=" * 80)
    print("CCS CONNECT: MOBILE & PRODUCTION READINESS TEST SUITE")
    print("=" * 80)

    client = APIClient()
    results = {}

    # -------------------------------------------------------------
    # 1. AUTHENTICATION & LOGIN FLOW (PART 3)
    # -------------------------------------------------------------
    print("\n--- 1. Testing Login Flow & Role Resolution ---")

    # Ensure standard QA accounts exist
    roles_to_test = [
        ('admin_test@ccs.com', 'AdminPass123!', UserRole.ADMIN, 'Admin User'),
        ('emp_test@ccs.com', 'EmpPass123!', UserRole.DISTRIBUTOR, 'Employee User'),
        ('dist_test@ccs.com', 'DistPass123!', UserRole.DISTRIBUTOR, 'Distributor User'),
        ('dealer_a@ccs.com', 'DealerPass123!', UserRole.DEALER, 'Dealer A User'),
        ('dealer_b@ccs.com', 'DealerPass123!', UserRole.DEALER, 'Dealer B User'),
        ('wh_test@ccs.com', 'WarehousePass123!', UserRole.WAREHOUSE, 'Warehouse User'),
    ]

    users = {}
    for email, pwd, role, name in roles_to_test:
        u, _ = User.objects.get_or_create(
            email=email,
            defaults={'username': email.split('@')[0], 'role': role, 'status': UserStatus.APPROVED, 'is_verified': True, 'first_name': name}
        )
        u.set_password(pwd)
        u.role = role
        u.status = UserStatus.APPROVED
        u.is_verified = True
        u.save()
        users[email] = u

    # Setup DealerProfiles
    dp_a, _ = DealerProfile.objects.get_or_create(
        user=users['dealer_a@ccs.com'],
        defaults={'company_name': 'Agro Retail A', 'city': 'Nashik', 'credit_limit': Decimal('500000.00')}
    )
    dp_b, _ = DealerProfile.objects.get_or_create(
        user=users['dealer_b@ccs.com'],
        defaults={'company_name': 'Agro Retail B', 'city': 'Nagpur', 'credit_limit': Decimal('300000.00')}
    )

    # Setup DistributorProfile
    dist_prof, _ = DistributorProfile.objects.get_or_create(
        user=users['dist_test@ccs.com'],
        defaults={'company_name': 'Maharashtra Agro Traders', 'territory': 'West Maharashtra'}
    )

    # Setup EmployeeProfile
    emp_prof, _ = EmployeeProfile.objects.get_or_create(
        user=users['emp_test@ccs.com'],
        defaults={'designation': 'Sales Officer', 'territory': 'Pune Division'}
    )

    # Test login endpoint without role parameter
    login_checks = []
    for email, pwd, expected_role, name in roles_to_test[:5]:
        res = client.post('/api/auth/login/', {'email_or_username': email, 'password': pwd}, format='json')
        if res.status_code == 200:
            returned_role = res.data.get('user', {}).get('role')
            tokens = 'access_token' in res.data and 'refresh_token' in res.data
            login_checks.append((email, returned_role == expected_role and tokens, f"Role: {returned_role}"))
        else:
            login_checks.append((email, False, f"Status: {res.status_code}"))

    # Test invalid password rejection
    bad_res = client.post('/api/auth/login/', {'email_or_username': 'admin_test@ccs.com', 'password': 'WrongPassword999'}, format='json')
    bad_pwd_ok = bad_res.status_code in [400, 401]

    # Test invalid user rejection
    invalid_user_res = client.post('/api/auth/login/', {'email_or_username': 'nonexistent_user@ccs.com', 'password': 'SomePassword123!'}, format='json')
    invalid_user_ok = invalid_user_res.status_code in [400, 401]

    results['login_flow'] = all(c[1] for c in login_checks) and bad_pwd_ok and invalid_user_ok
    print(f"Login & Role Resolution: {'PASS' if results['login_flow'] else 'FAIL'}")
    for email, ok, msg in login_checks:
        print(f"  - {email}: {'OK' if ok else 'FAIL'} ({msg})")
    print(f"  - Wrong password rejected: {'OK' if bad_pwd_ok else 'FAIL'}")
    print(f"  - Nonexistent user rejected: {'OK' if invalid_user_ok else 'FAIL'}")

    # -------------------------------------------------------------
    # 2. ADMIN USER MANAGEMENT (PART 4)
    # -------------------------------------------------------------
    print("\n--- 2. Testing Admin User Management ---")
    admin_client = APIClient()
    admin_client.force_authenticate(user=users['admin_test@ccs.com'])

    # Create new test user via admin API
    new_user_payload = {
        'username': 'new_field_officer',
        'email': 'officer_temp@ccs.com',
        'password': 'SecureOfficerPass123!',
        'first_name': 'Kavita',
        'last_name': 'Sharma',
        'role': UserRole.DISTRIBUTOR,
        'phone': '9876543210'
    }
    User.objects.filter(email='officer_temp@ccs.com').delete()
    
    create_res = admin_client.post('/api/admin/users/', new_user_payload, format='json')
    user_created_ok = create_res.status_code in [200, 201]

    if user_created_ok:
        created_user = User.objects.get(email='officer_temp@ccs.com')
        pwd_hashed_ok = not created_user.password.startswith('SecureOfficerPass123!') and (created_user.password.startswith('pbkdf2_') or created_user.password.startswith('argon2'))
        test_login = client.post('/api/auth/login/', {'email_or_username': 'officer_temp@ccs.com', 'password': 'SecureOfficerPass123!'}, format='json')
        new_user_login_ok = test_login.status_code == 200

        # Test status deactivation
        created_user.is_active = False
        created_user.save()
        suspended_login = client.post('/api/auth/login/', {'email_or_username': 'officer_temp@ccs.com', 'password': 'SecureOfficerPass123!'}, format='json')
        deactivation_ok = suspended_login.status_code in [400, 401, 403]
        
        created_user.delete()
        admin_mgmt_ok = pwd_hashed_ok and new_user_login_ok and deactivation_ok
    else:
        admin_mgmt_ok = False
        print(f"Failed to create user: {create_res.data if hasattr(create_res, 'data') else create_res.status_code}")

    results['admin_user_management'] = admin_mgmt_ok
    print(f"Admin User Management: {'PASS' if admin_mgmt_ok else 'FAIL'}")

    # -------------------------------------------------------------
    # 3. ROLE-BY-ROLE DATA ISOLATION (PART 6)
    # -------------------------------------------------------------
    print("\n--- 3. Testing Role Isolation & Permission Controls ---")

    dealer_a_client = APIClient()
    dealer_a_client.force_authenticate(user=users['dealer_a@ccs.com'])

    dealer_b_client = APIClient()
    dealer_b_client.force_authenticate(user=users['dealer_b@ccs.com'])

    wh_client = APIClient()
    wh_client.force_authenticate(user=users['wh_test@ccs.com'])

    emp_client = APIClient()
    emp_client.force_authenticate(user=users['emp_test@ccs.com'])

    emp_admin_access = emp_client.get('/api/admin/users/')
    emp_blocked_ok = emp_admin_access.status_code in [401, 403]

    results['role_isolation'] = emp_blocked_ok
    print(f"Role Isolation & Permissions: {'PASS' if results['role_isolation'] else 'FAIL'}")
    print(f"  - Employee blocked from Admin endpoints: {'OK' if emp_blocked_ok else 'FAIL'}")

    # -------------------------------------------------------------
    # 4. BUSINESS WORKFLOW (PART 7)
    # -------------------------------------------------------------
    print("\n--- 4. Testing End-to-End Workflow ---")
    cat, _ = Category.objects.get_or_create(name='Pesticides Test', defaults={'description': 'Test Pesticides'})
    brand, _ = Brand.objects.get_or_create(name='Chitra Test Brand')
    prod, _ = Product.objects.get_or_create(
        name='Chitra Bio Shield Mobile',
        defaults={
            'brand': brand,
            'category': cat,
            'technical_name': 'Bio-Extracts 25%',
            'mrp': 1200.00,
            'dealer_price': 850.00,
            'packing': '1 Ltr',
            'stock': 500,
            'status': 'Active'
        }
    )

    # 1. Employee creates order for Dealer A
    order_payload = {
        'dealer': str(users['dealer_a@ccs.com'].id),
        'payment_terms': 'Cash (15 Days)',
        'remarks': 'Mobile Test Order',
        'items': [{'product': str(prod.id), 'quantity': 5, 'rate': 850.00}]
    }
    order_res = emp_client.post('/api/orders/', order_payload, format='json')
    order_ok = order_res.status_code == 201
    assert order_ok, f"Order creation failed: {order_res.data}"
    order_id = order_res.data['id']
    order_obj = Order.objects.get(id=order_id)
    print(f"  - Order created successfully (ID: {order_obj.order_number}, Status: {order_obj.status})")

    # Check Dealer A sees order, Dealer B does NOT
    dealer_a_orders = dealer_a_client.get(f'/api/orders/{order_id}/')
    dealer_b_orders = dealer_b_client.get(f'/api/orders/{order_id}/')
    dealer_isolation_ok = dealer_a_orders.status_code == 200 and dealer_b_orders.status_code in [403, 404]
    print(f"  - Dealer Data Isolation: {'OK' if dealer_isolation_ok else 'FAIL'}")

    # Warehouse tries LR generation before approval -> Must FAIL (400, 403 or 404 Not Found)
    wh_early_lr = wh_client.post(f'/api/orders/{order_id}/generate_lr/', {'lr_number': 'LR-EARLY-FAIL'}, format='json')
    wh_early_lr_blocked = wh_early_lr.status_code in [400, 403, 404]
    print(f"  - Warehouse blocked from premature LR: {'OK' if wh_early_lr_blocked else 'FAIL'} (Status: {wh_early_lr.status_code})")

    # 2. Admin Approves Order
    approve_res = admin_client.post(f'/api/orders/{order_id}/approve/', {}, format='json')
    approve_ok = approve_res.status_code == 200
    order_obj.refresh_from_db()
    assert order_obj.status == OrderStatus.APPROVED
    print(f"  - Admin Approval: {'OK' if approve_ok else 'FAIL'}")

    # 3. Admin Uploads Bilty -> Order status transitions to READY_DISPATCH
    bilty_res = admin_client.post(f'/api/orders/{order_id}/upload_bilty/', {'bilty_number': 'BILTY-MOB-001'}, format='json')
    bilty_ok = bilty_res.status_code == 200
    order_obj.refresh_from_db()
    assert order_obj.status == OrderStatus.READY_DISPATCH
    print(f"  - Bilty Uploaded & Ready for Dispatch: {'OK' if bilty_ok else 'FAIL'}")

    # 4. Warehouse enters LR details (Must NOT automatically dispatch!)
    wh_lr_res = wh_client.post(f'/api/orders/{order_id}/generate_lr/', {
        'lr_number': 'LR-MOB-998877',
        'transport_details': 'VRL Logistics Express',
        'vehicle_number': 'MH-12-AB-9988'
    }, format='json')
    lr_ok = wh_lr_res.status_code == 200
    order_obj.refresh_from_db()
    not_auto_dispatched = order_obj.status == OrderStatus.READY_DISPATCH
    print(f"  - LR save does NOT auto-dispatch (Status remains Ready to Dispatch): {'OK' if not_auto_dispatched else 'FAIL'}")

    # 5. Warehouse explicitly dispatches
    wh_dispatch_res = wh_client.post(f'/api/orders/{order_id}/dispatch_order/', {}, format='json')
    dispatch_ok = wh_dispatch_res.status_code == 200
    order_obj.refresh_from_db()
    final_dispatch_ok = order_obj.status == OrderStatus.DISPATCHED and order_obj.lr_number == 'LR-MOB-998877'
    print(f"  - Warehouse explicit dispatch: {'OK' if final_dispatch_ok else 'FAIL'}")

    results['business_workflow'] = order_ok and dealer_isolation_ok and wh_early_lr_blocked and approve_ok and bilty_ok and not_auto_dispatched and final_dispatch_ok
    print(f"End-to-End Business Flow: {'PASS' if results['business_workflow'] else 'FAIL'}")

    # -------------------------------------------------------------
    # 5. SUMMARY
    # -------------------------------------------------------------
    print("\n" + "=" * 80)
    all_passed = all(results.values())
    print(f"FINAL TEST STATUS: {'ALL CHECKS PASSED' if all_passed else 'SOME CHECKS FAILED'}")
    print("=" * 80)
    return all_passed

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
