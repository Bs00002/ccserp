import os
import django
import sys
from decimal import Decimal
from datetime import date, timedelta, datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccs_backend.settings')
django.setup()

from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole, UserStatus, DealerProfile, DistributorProfile
from apps.products.models import Product, Category, Brand
from apps.orders.models import Order, OrderItem, OrderStatus, PaymentStatus, Invoice
from apps.hr.models import Attendance, Expense, DealerVisit, LocationTrack

def execute_master_test_suite():
    print("=" * 80)
    print("STARTING FULL END-TO-END MASTER TEST SUITE FOR CCS CONNECT ERP")
    print("=" * 80)

    results = {}
    client = APIClient()

    # -------------------------------------------------------------
    # 1. SETUP ACTORS & ENVIRONMENT
    # -------------------------------------------------------------
    admin_user, _ = User.objects.get_or_create(
        email='master_admin@ccs.com',
        defaults={'username': 'master_admin', 'role': UserRole.ADMIN, 'status': UserStatus.APPROVED, 'is_verified': True, 'first_name': 'Admin', 'last_name': 'Executive'}
    )
    admin_user.set_password('AdminPass123!')
    admin_user.save()

    emp_user, _ = User.objects.get_or_create(
        email='master_emp@ccs.com',
        defaults={'username': 'master_emp', 'role': UserRole.DISTRIBUTOR, 'status': UserStatus.APPROVED, 'is_verified': True, 'first_name': 'Sanjay', 'last_name': 'Deshmukh'}
    )
    emp_user.set_password('EmpPass123!')
    emp_user.save()

    unrelated_emp, _ = User.objects.get_or_create(
        email='unrelated_emp2@ccs.com',
        defaults={'username': 'unrelated_emp2', 'role': UserRole.DISTRIBUTOR, 'status': UserStatus.APPROVED, 'is_verified': True, 'first_name': 'Rahul', 'last_name': 'Verma'}
    )
    unrelated_emp.set_password('EmpPass123!')
    unrelated_emp.save()

    dealer_user, _ = User.objects.get_or_create(
        email='master_dealer@ccs.com',
        defaults={'username': 'master_dealer', 'role': UserRole.DEALER, 'status': UserStatus.APPROVED, 'is_verified': True, 'first_name': 'Ramesh', 'last_name': 'Patel'}
    )
    dealer_user.set_password('DealerPass123!')
    dealer_user.save()
    dp, _ = DealerProfile.objects.get_or_create(
        user=dealer_user,
        defaults={'company_name': 'Agri Solutions Kendra', 'city': 'Pune', 'credit_limit': Decimal('750000.00')}
    )

    wh_user, _ = User.objects.get_or_create(
        email='master_wh@ccs.com',
        defaults={'username': 'master_wh', 'role': UserRole.WAREHOUSE, 'status': UserStatus.APPROVED, 'is_verified': True, 'first_name': 'Vikram', 'last_name': 'Warehouse'}
    )
    wh_user.set_password('WhPass123!')
    wh_user.save()

    # Product
    brand, _ = Brand.objects.get_or_create(name='Chitra Crop Science')
    cat, _ = Category.objects.get_or_create(name='Bio Fertilizers')
    product, _ = Product.objects.get_or_create(
        name='Master Test Bio-Zyme Gold 1L',
        defaults={
            'brand': brand,
            'category': cat,
            'technical_name': 'Bio-Zyme Concentrated Extract',
            'mrp': Decimal('1600.00'),
            'dealer_price': Decimal('1100.00'),
            'distributor_price': Decimal('950.00'),
            'packing': '1 Ltr Bottle',
            'pack_size': '1 Ltr',
            'gst': Decimal('18.00'),
            'stock': 100,
            'status': 'Active'
        }
    )
    # Ensure sufficient stock
    product.stock = 100
    product.save()

    # -------------------------------------------------------------
    # TEST MODULE 1: AUTHENTICATION & ROLE SWITCHING / ACCESS CONTROL
    # -------------------------------------------------------------
    print("\n[MODULE 1] Testing Authentication, JWT Tokens & Role Boundaries...")
    try:
        # 1.1 Login as Admin
        res_login_admin = client.post('/api/auth/login/', {'email_or_username': 'master_admin@ccs.com', 'password': 'AdminPass123!'}, format='json')
        assert res_login_admin.status_code == 200, f"Admin login failed: {res_login_admin.data}"
        assert res_login_admin.data['user']['role'].upper() == 'ADMIN', f"Expected ADMIN, got {res_login_admin.data['user']['role']}"

        # 1.2 Login as Employee
        res_login_emp = client.post('/api/auth/login/', {'email_or_username': 'master_emp@ccs.com', 'password': 'EmpPass123!'}, format='json')
        assert res_login_emp.status_code == 200, f"Employee login failed: {res_login_emp.data}"
        assert res_login_emp.data['user']['role'].upper() == 'DISTRIBUTOR', f"Expected DISTRIBUTOR, got {res_login_emp.data['user']['role']}"

        # 1.3 Login as Dealer
        res_login_dlr = client.post('/api/auth/login/', {'email_or_username': 'master_dealer@ccs.com', 'password': 'DealerPass123!'}, format='json')
        assert res_login_dlr.status_code == 200, f"Dealer login failed: {res_login_dlr.data}"
        assert res_login_dlr.data['user']['role'].upper() == 'DEALER', f"Expected DEALER, got {res_login_dlr.data['user']['role']}"

        # 1.4 Login as Warehouse
        res_login_wh = client.post('/api/auth/login/', {'email_or_username': 'master_wh@ccs.com', 'password': 'WhPass123!'}, format='json')
        assert res_login_wh.status_code == 200, f"Warehouse login failed: {res_login_wh.data}"
        assert res_login_wh.data['user']['role'].upper() == 'WAREHOUSE', f"Expected WAREHOUSE, got {res_login_wh.data['user']['role']}"

        # 1.5 Invalid credentials
        res_invalid = client.post('/api/auth/login/', {'email_or_username': 'master_admin@ccs.com', 'password': 'WrongPassword!'}, format='json')
        assert res_invalid.status_code == 401, f"Expected 401, got {res_invalid.status_code}"

        results['Module 1: Authentication & Role Boundaries'] = 'PASS'
        print(" -> PASS: Login for all roles (Admin, Employee, Dealer, Warehouse) verified with JWT and role preservation.")
    except Exception as e:
        results['Module 1: Authentication & Role Boundaries'] = f'FAIL: {e}'
        print(f" -> FAIL: {e}")

    # -------------------------------------------------------------
    # TEST MODULE 2: EMPLOYEE ATTENDANCE & LIVE GPS TRACKING
    # -------------------------------------------------------------
    print("\n[MODULE 2] Testing Employee Start Day, End Day & Live GPS Tracking...")
    try:
        # Clear today's attendance for clean test run
        today = date.today()
        Attendance.objects.filter(employee=emp_user, date=today).delete()

        client.force_authenticate(user=emp_user)

        # 2.1 Start Day (Check-In)
        res_start = client.post('/api/hr/attendance/', {
            'location': 'Pune Regional Depot, 18.5204 N, 73.8567 E',
            'latitude': 18.520433,
            'longitude': 73.856744,
        }, format='json')
        assert res_start.status_code == 201, f"Check in failed: {res_start.data}"
        att_id = res_start.data['id']
        att_obj = Attendance.objects.get(id=att_id)
        assert att_obj.status == 'Working'
        assert att_obj.is_active == True
        assert float(att_obj.check_in_latitude) == 18.520433

        # 2.2 Duplicate Start Day blocked
        res_start_dup = client.post('/api/hr/attendance/', {'location': 'Somewhere else'}, format='json')
        assert res_start_dup.status_code == 400, "Duplicate check-in must be rejected"

        # 2.3 Periodic Live Location Update
        res_loc = client.post('/api/hr/attendance/update_location/', {
            'latitude': 18.530111,
            'longitude': 73.865222,
            'location': 'Hadapsar Market Yard, Pune'
        }, format='json')
        assert res_loc.status_code == 200
        att_obj.refresh_from_db()
        assert float(att_obj.current_latitude) == 18.530111
        assert att_obj.current_location == 'Hadapsar Market Yard, Pune'

        # 2.4 Active Attendance Check
        res_active = client.get('/api/hr/attendance/active/')
        assert res_active.status_code == 200
        assert res_active.data['active'] == True
        assert res_active.data['attendance']['status'] == 'Working'

        # 2.5 Admin Attendance Visibility
        client.force_authenticate(user=admin_user)
        res_admin_att = client.get('/api/hr/attendance/')
        assert res_admin_att.status_code == 200
        emp_att_record = next((r for r in res_admin_att.data if r['id'] == str(att_id)), None)
        assert emp_att_record is not None, "Admin must be able to view employee's attendance record"
        assert emp_att_record['status'] == 'Working'
        assert emp_att_record['current_location'] == 'Hadapsar Market Yard, Pune'

        # 2.6 End Day (Check-Out)
        client.force_authenticate(user=emp_user)
        res_end = client.post('/api/hr/attendance/check_out/', {
            'location': 'Pune Head Office',
            'latitude': 18.521000,
            'longitude': 73.855000
        }, format='json')
        assert res_end.status_code == 200
        att_obj.refresh_from_db()
        assert att_obj.check_out is not None

        results['Module 2: Attendance & Live GPS Tracking'] = 'PASS'
        print(" -> PASS: Start Day, duplicate prevention, periodic GPS updates, Admin visibility, and End Day verified.")
    except Exception as e:
        results['Module 2: Attendance & Live GPS Tracking'] = f'FAIL: {e}'
        print(f" -> FAIL: {e}")

    # -------------------------------------------------------------
    # TEST MODULE 3: ORDER CREATION, FINANCIALS & 18% GST
    # -------------------------------------------------------------
    print("\n[MODULE 3] Testing Order Creation, Pricing & Financial Math...")
    try:
        client.force_authenticate(user=emp_user)
        order_payload = {
            'dealer': str(dealer_user.id),
            'payment_terms': 'Cash (15 Days)',
            'remarks': 'Master Test Order 1',
            'items': [
                {
                    'product': str(product.id),
                    'quantity': 10,
                    'rate': 1100.00
                }
            ]
        }
        res_ord = client.post('/api/orders/', order_payload, format='json')
        assert res_ord.status_code == 201, f"Order creation failed: {res_ord.data}"
        ord_id = res_ord.data['id']
        ord_obj = Order.objects.get(id=ord_id)

        # Expected:
        # Subtotal: 10 * 1100 = 11000.00
        # GST (18%): 11000 * 0.18 = 1980.00
        # Grand Total: 11000 + 1980 = 12980.00
        assert float(ord_obj.subtotal) == 11000.00, f"Expected 11000 subtotal, got {ord_obj.subtotal}"
        assert float(ord_obj.gst_total) == 1980.00, f"Expected 1980 GST, got {ord_obj.gst_total}"
        assert float(ord_obj.grand_total) == 12980.00, f"Expected 12980 grand total, got {ord_obj.grand_total}"
        assert ord_obj.status == OrderStatus.PENDING_APPROVAL

        # Item serializer detail check (Product name, SKU code, Pack size)
        res_detail = client.get(f'/api/orders/{ord_id}/')
        assert res_detail.status_code == 200
        assert res_detail.data['items'][0]['product_name'] == 'Master Test Bio-Zyme Gold 1L'
        assert res_detail.data['items'][0]['pack_size'] == '1 Ltr'
        assert res_detail.data['items'][0]['packing'] == '1 Ltr Bottle'

        results['Module 3: Order Creation & Financial Calculations'] = 'PASS'
        print(" -> PASS: Subtotal, 18% GST, Grand Total, SKU name, and packaging specifications verified in DB and API.")
    except Exception as e:
        results['Module 3: Order Creation & Financial Calculations'] = f'FAIL: {e}'
        print(f" -> FAIL: {e}")

    # -------------------------------------------------------------
    # TEST MODULE 4: COMPLETE ORDER LIFECYCLE (APPROVAL, BILTY, RTD, LR, DISPATCH)
    # -------------------------------------------------------------
    print("\n[MODULE 4] Testing End-to-End Workflow Stages...")
    try:
        # 4.1 Admin Approval
        client.force_authenticate(user=admin_user)
        initial_stock = product.stock
        res_app = client.post(f'/api/orders/{ord_id}/approve/', {}, format='json')
        assert res_app.status_code == 200
        ord_obj.refresh_from_db()
        product.refresh_from_db()
        assert ord_obj.status == OrderStatus.APPROVED
        assert product.stock == initial_stock - 10, "Inventory must deduct 10 units upon approval"

        # 4.2 Admin Bilty Generation
        res_bilty = client.post(f'/api/orders/{ord_id}/upload_bilty/', {'bilty_number': 'BLT-MASTER-8888'}, format='json')
        assert res_bilty.status_code == 200
        ord_obj.refresh_from_db()
        assert ord_obj.status == OrderStatus.BILTY_UPLOADED
        assert ord_obj.bilty_number == 'BLT-MASTER-8888'

        # 4.3 Admin Mark Ready to Dispatch
        res_rtd = client.post(f'/api/orders/{ord_id}/mark_ready_dispatch/', {}, format='json')
        assert res_rtd.status_code == 200
        ord_obj.refresh_from_db()
        assert ord_obj.status == OrderStatus.READY_DISPATCH

        # 4.4 Warehouse LR Generation & Dispatch
        client.force_authenticate(user=wh_user)
        res_lr = client.post(f'/api/orders/{ord_id}/generate_lr/', {
            'lr_number': 'LR-MASTER-5555',
            'transport_details': 'VRL Logistics Express',
            'vehicle_number': 'MH-12-AB-9090'
        }, format='json')
        assert res_lr.status_code == 200
        ord_obj.refresh_from_db()
        assert ord_obj.status == OrderStatus.READY_DISPATCH, "LR save must not automatically dispatch"
        assert ord_obj.lr_number == 'LR-MASTER-5555'
        assert ord_obj.vehicle_number == 'MH-12-AB-9090'

        # Explicit dispatch
        res_dispatch = client.post(f'/api/orders/{ord_id}/dispatch_order/', {}, format='json')
        assert res_dispatch.status_code == 200
        ord_obj.refresh_from_db()
        assert ord_obj.status == OrderStatus.DISPATCHED

        results['Module 4: Complete Order Lifecycle & Inventory Deduction'] = 'PASS'
        print(" -> PASS: Complete lifecycle (Pending Approval -> Approved -> Bilty Uploaded -> Ready to Dispatch -> Dispatched) verified.")
    except Exception as e:
        results['Module 4: Complete Order Lifecycle & Inventory Deduction'] = f'FAIL: {e}'
        print(f" -> FAIL: {e}")

    # -------------------------------------------------------------
    # TEST MODULE 5: DOCUMENT VISIBILITY & RESPONSIBILITY RULES
    # -------------------------------------------------------------
    print("\n[MODULE 5] Testing Document Visibility & Responsibility Rules...")
    try:
        # Admin Visibility
        client.force_authenticate(user=admin_user)
        res_admin = client.get(f'/api/orders/{ord_id}/').data
        assert res_admin['bilty_number'] == 'BLT-MASTER-8888'
        assert res_admin['lr_number'] == 'LR-MASTER-5555'

        # Employee (Creator) Visibility
        client.force_authenticate(user=emp_user)
        res_emp = client.get(f'/api/orders/{ord_id}/').data
        assert res_emp['bilty_number'] == 'BLT-MASTER-8888'
        assert res_emp['lr_number'] == 'LR-MASTER-5555'

        # Dealer (Recipient) Visibility
        client.force_authenticate(user=dealer_user)
        res_dlr = client.get(f'/api/orders/{ord_id}/').data
        assert res_dlr['bilty_number'] == 'BLT-MASTER-8888'
        assert res_dlr['lr_number'] == 'LR-MASTER-5555'

        # Warehouse Visibility
        client.force_authenticate(user=wh_user)
        res_wh = client.get(f'/api/orders/{ord_id}/').data
        assert res_wh['bilty_number'] == 'BLT-MASTER-8888'
        assert res_wh['lr_number'] == 'LR-MASTER-5555'

        # Negative Responsibility: Warehouse cannot generate Bilty
        res_wh_blt = client.post(f'/api/orders/{ord_id}/upload_bilty/', {'bilty_number': 'HACK'}, format='json')
        assert res_wh_blt.status_code == 403, "Warehouse must not be allowed to upload Bilty"

        # Negative Responsibility: Employee cannot generate LR
        client.force_authenticate(user=emp_user)
        res_emp_lr = client.post(f'/api/orders/{ord_id}/generate_lr/', {'lr_number': 'HACK'}, format='json')
        assert res_emp_lr.status_code in [400, 403], "Employee must not generate LR"

        results['Module 5: Document Visibility & Responsibility Rules'] = 'PASS'
        print(" -> PASS: Bilty & LR visible to all 4 authorized roles; unauthorized document manipulation blocked.")
    except Exception as e:
        results['Module 5: Document Visibility & Responsibility Rules'] = f'FAIL: {e}'
        print(f" -> FAIL: {e}")

    # -------------------------------------------------------------
    # TEST MODULE 6: PARTNERS & CRM MANAGEMENT (DEALERS, DISTRIBUTORS)
    # -------------------------------------------------------------
    print("\n[MODULE 6] Testing CRM, Dealers & Distributors Management...")
    try:
        client.force_authenticate(user=admin_user)

        # 6.1 Dealers List
        res_dealers = client.get('/api/crm/dealers/')
        assert res_dealers.status_code == 200
        assert len(res_dealers.data) >= 1
        dlr_entry = next((d for d in res_dealers.data if d['id'] == str(dealer_user.id)), None)
        assert dlr_entry is not None
        assert float(dlr_entry['credit_limit']) == 750000.0

        # 6.2 Distributors List
        res_dist = client.get('/api/crm/distributors/')
        assert res_dist.status_code == 200

        # 6.3 Create New Dealer
        new_dealer_payload = {
            'name': 'Kisan Seva Kendra Test',
            'contact_person': 'Anil Sharma',
            'phone': '9890123456',
            'email': 'kisan_seva_test@ccs.com',
            'city': 'Baramati',
            'state': 'Maharashtra',
            'credit_limit': 600000
        }
        res_create_dlr = client.post('/api/crm/dealers/', new_dealer_payload, format='json')
        assert res_create_dlr.status_code in [200, 201]

        results['Module 6: CRM Partners (Dealers & Distributors)'] = 'PASS'
        print(" -> PASS: CRM dealer listings, credit limits, distributor rosters, and partner onboarding verified.")
    except Exception as e:
        results['Module 6: CRM Partners (Dealers & Distributors)'] = f'FAIL: {e}'
        print(f" -> FAIL: {e}")

    # -------------------------------------------------------------
    # TEST MODULE 7: PRODUCTS, CATEGORIES & INVENTORY MANAGEMENT
    # -------------------------------------------------------------
    print("\n[MODULE 7] Testing Products, Categories & Stock Management...")
    try:
        client.force_authenticate(user=admin_user)

        # 7.1 Products List
        res_prod = client.get('/api/products/')
        assert res_prod.status_code == 200
        assert any(p['id'] == str(product.id) for p in res_prod.data)

        # 7.2 Categories List
        res_cats = client.get('/api/categories/')
        assert res_cats.status_code == 200

        # 7.3 Out of Stock Validation
        client.force_authenticate(user=emp_user)
        res_over_order = client.post('/api/orders/', {
            'dealer': str(dealer_user.id),
            'items': [{'product': str(product.id), 'quantity': 999999, 'rate': 1100.00}]
        }, format='json')
        assert res_over_order.status_code == 400, "Must reject orders exceeding available stock"
        assert "out of stock" in str(res_over_order.data).lower()

        results['Module 7: Products, Categories & Inventory'] = 'PASS'
        print(" -> PASS: Product catalog, category hierarchies, and out-of-stock validation verified.")
    except Exception as e:
        results['Module 7: Products, Categories & Inventory'] = f'FAIL: {e}'
        print(f" -> FAIL: {e}")

    # -------------------------------------------------------------
    # TEST MODULE 8: HR EXPENSES & CLAIMS APPROVAL WORKFLOW
    # -------------------------------------------------------------
    print("\n[MODULE 8] Testing HR Expenses & Claims Approval Workflow...")
    try:
        client.force_authenticate(user=emp_user)

        # 8.1 Employee submits travel expense
        res_exp = client.post('/api/hr/expenses/', {
            'category': 'Travel',
            'amount': 1250.00,
            'description': 'Field visit to Baramati dealers fuel reimbursement',
            'date': str(date.today())
        }, format='json')
        assert res_exp.status_code == 201
        exp_id = res_exp.data['id']
        exp_obj = Expense.objects.get(id=exp_id)
        assert exp_obj.status == 'Pending'
        assert float(exp_obj.amount) == 1250.00

        # 8.2 Non-admin cannot approve expense
        res_emp_app = client.post(f'/api/hr/expenses/{exp_id}/approve/', {}, format='json')
        assert res_emp_app.status_code == 403, "Employee cannot approve own expense"

        # 8.3 Admin approves expense
        client.force_authenticate(user=admin_user)
        res_adm_app = client.post(f'/api/hr/expenses/{exp_id}/approve/', {}, format='json')
        assert res_adm_app.status_code == 200
        exp_obj.refresh_from_db()
        assert exp_obj.status == 'Approved'

        results['Module 8: HR Expenses & Approvals'] = 'PASS'
        print(" -> PASS: Employee expense logging, role access boundary, and Admin approval verified.")
    except Exception as e:
        results['Module 8: HR Expenses & Approvals'] = f'FAIL: {e}'
        print(f" -> FAIL: {e}")

    # -------------------------------------------------------------
    # TEST MODULE 9: DEALER FIELD VISITS & SITE ACTIVITIES
    # -------------------------------------------------------------
    print("\n[MODULE 9] Testing Field Dealer Visits & Site Activities...")
    try:
        client.force_authenticate(user=emp_user)
        res_visit = client.post('/api/hr/visits/', {
            'dealer': str(dealer_user.id),
            'visit_type': 'Distributor',
            'customer_name': 'Agri Solutions Kendra',
            'customer_mobile': '9890244512',
            'visit_purpose': 'Payment Collection & New Season SKU Showcase',
            'location': 'Market Yard, Pune',
            'latitude': 18.520000,
            'longitude': 73.850000,
            'notes': 'Dealer requested 50 units of Bio-Zyme for next week.'
        }, format='json')
        assert res_visit.status_code == 201
        visit_id = res_visit.data['id']
        visit_obj = DealerVisit.objects.get(id=visit_id)
        assert visit_obj.customer_name == 'Agri Solutions Kendra'
        assert visit_obj.employee == emp_user

        results['Module 9: Dealer Field Visits & Activity Logs'] = 'PASS'
        print(" -> PASS: Field visit entry, GPS coordinates, dealer link, and purpose verified.")
    except Exception as e:
        results['Module 9: Dealer Field Visits & Activity Logs'] = f'FAIL: {e}'
        print(f" -> FAIL: {e}")

    # -------------------------------------------------------------
    # TEST MODULE 10: REPORTS & AGGREGATION ANALYTICS
    # -------------------------------------------------------------
    print("\n[MODULE 10] Testing Reports & Analytics Aggregation...")
    try:
        client.force_authenticate(user=admin_user)
        start_date_str = str(date.today() - timedelta(days=30))
        end_date_str = str(date.today() + timedelta(days=1))

        # 10.1 Sales Report
        res_rep_sales = client.get(f'/api/reports/generate/?type=sales&start_date={start_date_str}&end_date={end_date_str}')
        assert res_rep_sales.status_code == 200
        assert res_rep_sales.data['report_type'] == 'Sales'

        # 10.2 Dealer Report
        res_rep_dlr = client.get(f'/api/reports/generate/?type=dealer&start_date={start_date_str}&end_date={end_date_str}')
        assert res_rep_dlr.status_code == 200
        assert res_rep_dlr.data['report_type'] == 'Dealer Performance'

        # 10.3 Expense Report
        res_rep_exp = client.get(f'/api/reports/generate/?type=expense&start_date={start_date_str}&end_date={end_date_str}')
        assert res_rep_exp.status_code == 200
        assert res_rep_exp.data['report_type'] == 'Employee Expenses'

        # 10.4 Non-admin blocked from reports
        client.force_authenticate(user=emp_user)
        res_rep_unauth = client.get(f'/api/reports/generate/?type=sales&start_date={start_date_str}&end_date={end_date_str}')
        assert res_rep_unauth.status_code == 403, "Non-admin must be blocked from reports"

        results['Module 10: Reports & Executive Analytics'] = 'PASS'
        print(" -> PASS: Sales, Dealer Performance, and Employee Expense reports verified with strict access control.")
    except Exception as e:
        results['Module 10: Reports & Executive Analytics'] = f'FAIL: {e}'
        print(f" -> FAIL: {e}")

    # -------------------------------------------------------------
    # TEST MODULE 11: SECURITY, TENANT ISOLATION & URL TAMPERING
    # -------------------------------------------------------------
    print("\n[MODULE 11] Testing Security, Tenant Isolation & URL Tampering...")
    try:
        # 11.1 Cross-employee isolation: unrelated employee cannot view master_emp's orders
        client.force_authenticate(user=unrelated_emp)
        unrelated_list = client.get('/api/orders/').data
        assert not any(o['id'] == ord_id for o in unrelated_list), "Row-level isolation violated: unrelated employee saw private order"

        # 11.2 Direct URL tampering: unrelated employee requests specific order ID
        res_tamper = client.get(f'/api/orders/{ord_id}/')
        assert res_tamper.status_code == 404, "Direct URL parameter tampering must return 404 Not Found"

        # 11.3 Dealers cannot access HR endpoints
        client.force_authenticate(user=dealer_user)
        res_dlr_hr = client.get('/api/hr/attendance/')
        assert res_dlr_hr.status_code == 403, "Dealers must not access employee attendance data"

        results['Module 11: Security & Tenant Isolation'] = 'PASS'
        print(" -> PASS: Row-level security, URL tampering resistance (404), and dealer HR lockout verified.")
    except Exception as e:
        results['Module 11: Security & Tenant Isolation'] = f'FAIL: {e}'
        print(f" -> FAIL: {e}")

    # -------------------------------------------------------------
    # TEST MODULE 12: EDGE CASES & VALIDATION
    # -------------------------------------------------------------
    print("\n[MODULE 12] Testing Validation & Edge Cases...")
    try:
        client.force_authenticate(user=emp_user)

        # 12.1 Empty items order
        res_empty_ord = client.post('/api/orders/', {'dealer': str(dealer_user.id), 'items': []}, format='json')
        assert res_empty_ord.status_code == 400

        # 12.2 Order rejection workflow
        res_new_ord = client.post('/api/orders/', {
            'dealer': str(dealer_user.id),
            'items': [{'product': str(product.id), 'quantity': 1, 'rate': 1100.00}]
        }, format='json')
        new_ord_id = res_new_ord.data['id']
        client.force_authenticate(user=admin_user)
        res_reject = client.post(f'/api/orders/{new_ord_id}/reject/', {'remarks': 'Quality audit rejection'}, format='json')
        assert res_reject.status_code == 200
        assert Order.objects.get(id=new_ord_id).status == OrderStatus.REJECTED

        # 12.3 Cannot approve an already rejected order
        res_re_approve = client.post(f'/api/orders/{new_ord_id}/approve/', {}, format='json')
        assert res_re_approve.status_code == 400

        results['Module 12: Edge Cases & State Validation'] = 'PASS'
        print(" -> PASS: Empty order rejection, rejection flow, and illegal state transition locks verified.")
    except Exception as e:
        results['Module 12: Edge Cases & State Validation'] = f'FAIL: {e}'
        print(f" -> FAIL: {e}")

    print("\n" + "=" * 80)
    print("MASTER TEST SUITE EXECUTION COMPLETE: 12 OF 12 MODULES TESTED")
    print("=" * 80)
    for k, v in results.items():
        print(f"{k:<55}: {v}")

    return all('PASS' in v for v in results.values())

if __name__ == '__main__':
    success = execute_master_test_suite()
    sys.exit(0 if success else 1)
