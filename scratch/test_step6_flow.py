import os
import sys
import django
from decimal import Decimal

# Setup Django environment
sys.path.insert(0, os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccs_backend.settings')
django.setup()

from apps.accounts.models import User, UserRole, EmployeeProfile, DistributorProfile
from apps.orders.models import Order, OrderStatus, OrderItem
from apps.products.models import Product
from apps.wallet.models import Wallet, LedgerEntry, LedgerEntryType
from apps.support.models import Complaint, ReturnRequest, Enquiry, ComplaintStatus, ReturnStatus
from apps.hr.views import SalesTargetViewSet
from apps.support.views import ComplaintViewSet, ReturnRequestViewSet, EnquiryViewSet
from apps.reports.views import dashboard_summary
from rest_framework.test import APIRequestFactory, force_authenticate

def run_tests():
    factory = APIRequestFactory()

    print("================================================================")
    print("STEP 6: SALES TARGETS, SUPPORT & DASHBOARD E2E VERIFICATION TEST")
    print("================================================================")

    # 1. Fetch test users
    admin_user = User.objects.filter(role__in=[UserRole.SUPER_ADMIN, UserRole.ADMIN]).first()
    field_user = User.objects.filter(role=UserRole.DISTRIBUTOR).first() or User.objects.filter(email='master_emp@ccs.com').first()
    dealer1_user = User.objects.filter(role=UserRole.DEALER).first()
    dealer2_user = User.objects.filter(role=UserRole.DEALER).exclude(id=dealer1_user.id).first()

    assert admin_user, "Admin user required"
    assert field_user, "Field user required"
    assert dealer1_user, "Dealer 1 user required"
    if not dealer2_user:
        dealer2_user = User.objects.create_user(
            username='dealer2_step6_test',
            email='dealer2_step6@ccs.com',
            password='TestPass123!',
            role=UserRole.DEALER
        )

    print(f"Users ready:")
    print(f"  Admin: {admin_user.email} ({admin_user.role})")
    print(f"  Field/Distributor: {field_user.email} ({field_user.role})")
    print(f"  Dealer 1: {dealer1_user.email} ({dealer1_user.role})")
    print(f"  Dealer 2: {dealer2_user.email} ({dealer2_user.role})")

    # =================================================================
    # MODULE 1: SALES TARGETS
    # =================================================================
    print("\n--- MODULE 1: SALES TARGETS ---")
    target_list_view = SalesTargetViewSet.as_view({'get': 'list'})
    target_update_view = SalesTargetViewSet.as_view({'post': 'update_target'})

    # 1.1 Admin lists all targets
    req = factory.get('/api/hr/targets/')
    force_authenticate(req, user=admin_user)
    res = target_list_view(req)
    assert res.status_code == 200, f"Admin list targets failed: {res.status_code}"
    print(f"  [PASS] Admin retrieved {len(res.data)} employee/distributor target records.")

    # 1.2 Non-admin (Field User) role isolation
    req = factory.get('/api/hr/targets/')
    force_authenticate(req, user=field_user)
    res_field = target_list_view(req)
    assert res_field.status_code == 200
    assert len(res_field.data) == 1, f"Field user must only see their own target, got {len(res_field.data)}"
    assert res_field.data[0]['userId'] == str(field_user.id), "Target record user ID mismatch"
    print(f"  [PASS] Role isolation verified: Field user sees only own target record.")

    # 1.3 Create real order & ledger entry to verify actual_sales & actual_collections calculations
    product = Product.objects.first()
    if not product:
        product = Product.objects.create(name='Test Agro Product', mrp=500.0, stock=100)

    test_order = Order.objects.create(
        dealer=dealer1_user,
        created_by=field_user,
        status=OrderStatus.APPROVED,
        subtotal=10000.00,
        gst_total=1800.00,
        grand_total=11800.00
    )

    wallet, _ = Wallet.objects.get_or_create(dealer=dealer1_user)
    test_collection = LedgerEntry.objects.create(
        wallet=wallet,
        type=LedgerEntryType.COLLECTION,
        amount=5000.00,
        created_by=field_user,
        notes='Step 6 Collection verification'
    )

    # Re-fetch field user target and verify calculated actuals
    req = factory.get('/api/hr/targets/')
    force_authenticate(req, user=field_user)
    res_field_calc = target_list_view(req)
    field_target_data = res_field_calc.data[0]
    assert field_target_data['achievedAmount'] >= 11800.00, f"Calculated actual sales mismatch: {field_target_data['achievedAmount']}"
    assert field_target_data['actualCollections'] >= 5000.00, f"Calculated actual collections mismatch: {field_target_data['actualCollections']}"
    print(f"  [PASS] Calculated actual sales ({field_target_data['achievedAmount']}) and actual collections ({field_target_data['actualCollections']}) verified from real DB records.")

    # 1.4 Admin updates target and verifies persistence
    new_target_amount = 250000.00
    new_sales_plan = 200000.00
    new_coll_plan = 180000.00
    req = factory.post(f'/api/hr/targets/{field_user.id}/update_target/', {
        'targetAmount': new_target_amount,
        'monthlySalesPlan': new_sales_plan,
        'monthlyCollectionPlan': new_coll_plan
    })
    force_authenticate(req, user=admin_user)
    res_update = target_update_view(req, pk=str(field_user.id))
    assert res_update.status_code == 200, f"Admin update target failed: {res_update.data}"
    assert res_update.data['targetAmount'] == new_target_amount
    assert res_update.data['monthlySalesPlan'] == new_sales_plan
    assert res_update.data['monthlyCollectionPlan'] == new_coll_plan

    # Verify persistence in database
    if field_user.role == UserRole.DISTRIBUTOR:
        dist_prof = DistributorProfile.objects.get(user=field_user)
        assert dist_prof.monthly_sales_plan == Decimal(str(new_sales_plan))
        assert dist_prof.monthly_collection_plan == Decimal(str(new_coll_plan))
    else:
        emp_prof = EmployeeProfile.objects.get(user=field_user)
        assert emp_prof.sales_target == Decimal(str(new_target_amount))
    print(f"  [PASS] Admin target update persisted in database: Sales Target={new_target_amount}, Sales Plan={new_sales_plan}, Collection Plan={new_coll_plan}")

    # 1.5 Non-admin unauthorized update rejection (403 Forbidden)
    req = factory.post(f'/api/hr/targets/{field_user.id}/update_target/', {
        'targetAmount': 999999.00
    })
    force_authenticate(req, user=dealer1_user)
    res_unauth = target_update_view(req, pk=str(field_user.id))
    assert res_unauth.status_code == 403, f"Expected 403 for non-admin target update, got {res_unauth.status_code}"
    print(f"  [PASS] Non-admin target update blocked with 403 Forbidden.")

    # =================================================================
    # MODULE 2: SUPPORT / COMPLAINTS / RETURNS / ENQUIRIES
    # =================================================================
    print("\n--- MODULE 2: SUPPORT, COMPLAINTS & RETURNS ---")
    complaint_list_create = ComplaintViewSet.as_view({'get': 'list', 'post': 'create'})
    complaint_update_status = ComplaintViewSet.as_view({'post': 'update_status'})
    return_list_create = ReturnRequestViewSet.as_view({'get': 'list', 'post': 'create'})
    return_update_status = ReturnRequestViewSet.as_view({'post': 'update_status'})
    enquiry_list_create = EnquiryViewSet.as_view({'get': 'list', 'post': 'create'})
    enquiry_resolve = EnquiryViewSet.as_view({'post': 'resolve'})

    # 2.1 Dealer 1 creates a Complaint
    req = factory.post('/api/support/complaints/', {
        'category': 'Quality',
        'description': 'Suspicious sedimentation observed in 5L bottle batch #B2026-99'
    })
    force_authenticate(req, user=dealer1_user)
    res_comp = complaint_list_create(req)
    assert res_comp.status_code == 201, f"Complaint creation failed: {res_comp.data}"
    complaint_id = res_comp.data['id']
    assert Complaint.objects.filter(id=complaint_id).exists(), "Complaint not found in DB"
    print(f"  [PASS] Complaint created and persisted: ID={complaint_id}")

    # 2.2 Dealer 1 creates a ReturnRequest
    # Need OrderItem
    order_item = OrderItem.objects.filter(order=test_order).first()
    if not order_item:
        order_item = OrderItem.objects.create(
            order=test_order,
            product=product,
            quantity=10,
            rate=1000.0,
            total=10000.0
        )
    req = factory.post('/api/support/returns/', {
        'order': str(test_order.id),
        'order_item': str(order_item.id),
        'reason': 'Damage',
        'quantity': 2,
        'description': 'Bottles damaged during transit'
    })
    force_authenticate(req, user=dealer1_user)
    res_ret = return_list_create(req)
    assert res_ret.status_code == 201, f"ReturnRequest creation failed: {res_ret.data}"
    return_id = res_ret.data['id']
    assert ReturnRequest.objects.filter(id=return_id).exists(), "ReturnRequest not found in DB"
    print(f"  [PASS] ReturnRequest created and persisted: ID={return_id}")

    # 2.3 Create an Enquiry
    req = factory.post('/api/support/enquiries/', {
        'name': 'Ramesh Patel',
        'email': 'ramesh@farmer.in',
        'phone': '9876543210',
        'department': 'Product Inquiry',
        'message': 'Looking for Bio-NPK distributorship in Mehsana district'
    })
    res_enq = enquiry_list_create(req)
    assert res_enq.status_code == 201, f"Enquiry creation failed: {res_enq.data}"
    enquiry_id = res_enq.data['id']
    assert Enquiry.objects.filter(id=enquiry_id).exists(), "Enquiry not found in DB"
    print(f"  [PASS] Enquiry created and persisted: ID={enquiry_id}")

    # 2.4 Role and Data Isolation: Dealer 1 sees only own tickets; Dealer 2 sees 0; Admin sees all
    req = factory.get('/api/support/complaints/')
    force_authenticate(req, user=dealer1_user)
    res_d1 = complaint_list_create(req)
    assert any(c['id'] == complaint_id for c in res_d1.data), "Dealer 1 should see own complaint"

    req = factory.get('/api/support/complaints/')
    force_authenticate(req, user=dealer2_user)
    res_d2 = complaint_list_create(req)
    assert not any(c['id'] == complaint_id for c in res_d2.data), "Dealer 2 must NOT see Dealer 1's complaint"
    print(f"  [PASS] Dealer isolation verified: Dealer 2 cannot see Dealer 1's complaint.")

    req = factory.get('/api/support/complaints/')
    force_authenticate(req, user=admin_user)
    res_adm_comp = complaint_list_create(req)
    assert any(c['id'] == complaint_id for c in res_adm_comp.data), "Admin must see all complaints"
    print(f"  [PASS] Admin oversight verified: Admin retrieves all complaints.")

    # 2.5 Admin updates Complaint status
    req = factory.post(f'/api/support/complaints/{complaint_id}/update_status/', {
        'status': 'In Progress',
        'resolution_timeline': 'Field QC officer assigned to collect sample by 28th.'
    })
    force_authenticate(req, user=admin_user)
    res_comp_up = complaint_update_status(req, pk=complaint_id)
    assert res_comp_up.status_code == 200, f"Complaint status update failed: {res_comp_up.data}"
    assert res_comp_up.data['status'] == 'In Progress'

    # Verify persistence in DB
    db_comp = Complaint.objects.get(id=complaint_id)
    assert db_comp.status == 'In Progress'
    assert 'Field QC' in db_comp.resolution_timeline
    print(f"  [PASS] Admin updated complaint status to 'In Progress' and persisted resolution timeline.")

    # 2.6 Admin updates ReturnRequest status
    req = factory.post(f'/api/support/returns/{return_id}/update_status/', {
        'status': 'Approved'
    })
    force_authenticate(req, user=admin_user)
    res_ret_up = return_update_status(req, pk=return_id)
    assert res_ret_up.status_code == 200, f"Return status update failed: {res_ret_up.data}"
    assert res_ret_up.data['status'] == 'Approved'

    db_ret = ReturnRequest.objects.get(id=return_id)
    assert db_ret.status == 'Approved'
    print(f"  [PASS] Admin updated return request status to 'Approved' and persisted in DB.")

    # 2.7 Admin resolves Enquiry
    req = factory.post(f'/api/support/enquiries/{enquiry_id}/resolve/')
    force_authenticate(req, user=admin_user)
    res_enq_up = enquiry_resolve(req, pk=enquiry_id)
    assert res_enq_up.status_code == 200, f"Enquiry resolve failed: {res_enq_up.data}"
    assert res_enq_up.data['is_resolved'] is True

    db_enq = Enquiry.objects.get(id=enquiry_id)
    assert db_enq.is_resolved is True
    print(f"  [PASS] Admin resolved enquiry and persisted in DB.")

    # 2.8 Unauthorized status update blocked (Dealer cannot update status)
    req = factory.post(f'/api/support/complaints/{complaint_id}/update_status/', {
        'status': 'Closed'
    })
    force_authenticate(req, user=dealer1_user)
    res_unauth_comp = complaint_update_status(req, pk=complaint_id)
    assert res_unauth_comp.status_code == 403, f"Expected 403 for unauthorized status update, got {res_unauth_comp.status_code}"
    print(f"  [PASS] Dealer blocked from updating complaint status (403 Forbidden).")

    # =================================================================
    # MODULE 3: DASHBOARD KPI / SUMMARY DATA
    # =================================================================
    print("\n--- MODULE 3: DASHBOARD KPI & SUMMARY DATA ---")

    # 3.1 Admin Dashboard
    req = factory.get('/api/dashboard/')
    force_authenticate(req, user=admin_user)
    res_dash_admin = dashboard_summary(req)
    assert res_dash_admin.status_code == 200, f"Admin dashboard failed: {res_dash_admin.data}"
    dash_admin = res_dash_admin.data

    assert 'total_sales' in dash_admin, "Missing total_sales in admin dashboard"
    assert 'today_orders_count' in dash_admin, "Missing today_orders_count"
    assert 'pending_orders_count' in dash_admin, "Missing pending_orders_count"
    assert 'total_dealers_count' in dash_admin, "Missing total_dealers_count"
    assert 'total_distributors_count' in dash_admin, "Missing total_distributors_count"
    assert 'active_field_staff_count' in dash_admin, "Missing active_field_staff_count"
    assert 'total_products_count' in dash_admin, "Missing total_products_count"
    assert 'low_stock_count' in dash_admin, "Missing low_stock_count"
    assert 'total_collections' in dash_admin, "Missing total_collections"
    assert 'sales_graph_data' in dash_admin, "Missing sales_graph_data"
    assert 'order_status_distribution' in dash_admin, "Missing order_status_distribution"
    assert dash_admin.get('mock') is not True, "Dashboard returned mock flag!"
    print(f"  [PASS] Admin Dashboard live KPI metrics verified:")
    print(f"         Total Sales: {dash_admin['total_sales_display'].replace(chr(8377), 'INR ')}")
    print(f"         Dealers: {dash_admin['total_dealers_count']}, Distributors: {dash_admin['total_distributors_count']}")
    print(f"         Products: {dash_admin['total_products_count']}, Low Stock: {dash_admin['low_stock_count']}")
    print(f"         Collections: INR {dash_admin['total_collections']:,.2f}")
    print(f"         Order Status Distribution slices: {len(dash_admin['order_status_distribution'])}")

    # 3.2 Dealer Dashboard Isolation
    req = factory.get('/api/dashboard/')
    force_authenticate(req, user=dealer1_user)
    res_dash_dealer = dashboard_summary(req)
    assert res_dash_dealer.status_code == 200
    dash_dealer = res_dash_dealer.data
    assert dash_dealer['role'] == UserRole.DEALER
    assert 'credit_limit' in dash_dealer
    assert 'outstanding_amount' in dash_dealer
    assert 'open_complaints' in dash_dealer
    print(f"  [PASS] Dealer Dashboard scoped to authenticated dealer: Orders={dash_dealer['total_orders_count']}, Open Complaints={dash_dealer['open_complaints']}")

    # 3.3 Distributor Dashboard Isolation
    req = factory.get('/api/dashboard/')
    force_authenticate(req, user=field_user)
    res_dash_dist = dashboard_summary(req)
    assert res_dash_dist.status_code == 200
    dash_dist = res_dash_dist.data
    assert dash_dist['role'] == UserRole.DISTRIBUTOR
    assert 'total_orders_count' in dash_dist
    assert 'total_collections' in dash_dist
    print(f"  [PASS] Distributor Dashboard scoped to authenticated distributor: Orders={dash_dist['total_orders_count']}, Collections=INR {dash_dist['total_collections']:,.2f}")

    print("\n================================================================")
    print("ALL STEP 6 TESTS PASSED SUCCESSFULLY!")
    print("================================================================")

if __name__ == '__main__':
    run_tests()
