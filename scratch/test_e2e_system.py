import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

print("==========================================")
print("     STARTING END-TO-END SYSTEM TEST      ")
print("==========================================")

results = []

def record_test(name, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    results.append((name, status, detail))
    print(f"[{status}] {name} - {detail}")

# TEST 1: AUTHENTICATION
admin_token = None
try:
    res = requests.post(f"{BASE_URL}/auth/login/", json={
        "email_or_username": "master_admin@ccs.com",
        "password": "AdminPass123!"
    })
    if res.status_code == 200:
        data = res.json()
        admin_token = data.get("access_token")
        record_test("Test 1A: Admin Login", True, f"Role: {data.get('user', {}).get('role')}")
    else:
        record_test("Test 1A: Admin Login", False, f"Status: {res.status_code}")
except Exception as e:
    record_test("Test 1A: Admin Login", False, str(e))

distributor_token = None
try:
    res = requests.post(f"{BASE_URL}/auth/login/", json={
        "email_or_username": "master_emp@ccs.com",
        "password": "EmpPass123!"
    })
    if res.status_code == 200:
        data = res.json()
        distributor_token = data.get("access_token")
        record_test("Test 1B: Distributor Login", True, f"Role: {data.get('user', {}).get('role')}")
    else:
        record_test("Test 1B: Distributor Login", False, f"Status: {res.status_code}")
except Exception as e:
    record_test("Test 1B: Distributor Login", False, str(e))

dealer_token = None
try:
    res = requests.post(f"{BASE_URL}/auth/login/", json={
        "email_or_username": "master_dealer@ccs.com",
        "password": "DealerPass123!"
    })
    if res.status_code == 200:
        data = res.json()
        dealer_token = data.get("access_token")
        record_test("Test 1C: Dealer Login", True, f"Role: {data.get('user', {}).get('role')}")
    else:
        record_test("Test 1C: Dealer Login", False, f"Status: {res.status_code}")
except Exception as e:
    record_test("Test 1C: Dealer Login", False, str(e))

# TEST 2: RBAC
if dealer_token:
    res = requests.get(f"{BASE_URL}/admin/approvals/", headers={"Authorization": f"Bearer {dealer_token}"})
    record_test("Test 2A: RBAC Dealer blocked from Admin Approvals", res.status_code == 403, f"Status: {res.status_code}")

if admin_token:
    res = requests.get(f"{BASE_URL}/admin/approvals/", headers={"Authorization": f"Bearer {admin_token}"})
    record_test("Test 2B: RBAC Admin allowed Admin Approvals", res.status_code == 200, f"Status: {res.status_code}")

# TEST 3: PRODUCTS API
products_list = []
if admin_token:
    res = requests.get(f"{BASE_URL}/products/", headers={"Authorization": f"Bearer {admin_token}"})
    if res.status_code == 200:
        products_list = res.json()
        record_test("Test 3: Products API (Admin)", True, f"Loaded {len(products_list)} products")
    else:
        record_test("Test 3: Products API (Admin)", False, f"Status: {res.status_code}")

# TEST 4: DEALERS API
dealers_list = []
if admin_token:
    res = requests.get(f"{BASE_URL}/public/dealers/", headers={"Authorization": f"Bearer {admin_token}"})
    if res.status_code == 200:
        dealers_list = res.json()
        record_test("Test 4: Dealers List API", True, f"Loaded {len(dealers_list)} dealers")
    else:
        record_test("Test 4: Dealers List API", False, f"Status: {res.status_code}")

# TEST 5: ORDER CREATION
if dealer_token and products_list:
    prod_id = products_list[0]["id"]
    res = requests.post(f"{BASE_URL}/orders/", headers={"Authorization": f"Bearer {dealer_token}"}, json={
        "items": [{"product": prod_id, "quantity": 2, "rate": 650}],
        "remarks": "E2E Dealer Order"
    })
    if res.status_code in [201, 200]:
        order_data = res.json()
        record_test("Test 5: Order Creation (Dealer)", True, f"Order #: {order_data.get('order_number')}, Total: INR {order_data.get('grand_total')}")
    else:
        record_test("Test 5: Order Creation (Dealer)", False, f"Status: {res.status_code}, Body: {res.text[:150]}")

# TEST 6: ATTENDANCE API
if distributor_token:
    res = requests.get(f"{BASE_URL}/hr/attendance/", headers={"Authorization": f"Bearer {distributor_token}"})
    record_test("Test 6: Attendance API (Distributor)", res.status_code == 200, f"Status: {res.status_code}")

# TEST 7: EXPENSES API
if distributor_token:
    res = requests.get(f"{BASE_URL}/hr/expenses/", headers={"Authorization": f"Bearer {distributor_token}"})
    record_test("Test 7: Expenses API (Distributor)", res.status_code == 200, f"Status: {res.status_code}")

# TEST 8: REPORTS API
if admin_token:
    res = requests.get(f"{BASE_URL}/reports/generate/?type=sales&start_date=2026-01-01&end_date=2026-12-31", headers={"Authorization": f"Bearer {admin_token}"})
    record_test("Test 8: Reports API (Admin)", res.status_code == 200, f"Status: {res.status_code}")

# TEST 9: NOTIFICATIONS API
if admin_token:
    res = requests.get(f"{BASE_URL}/notifications/", headers={"Authorization": f"Bearer {admin_token}"})
    record_test("Test 9: Notifications API (Admin)", res.status_code == 200, f"Status: {res.status_code}")

print("\n==========================================")
print("              SUMMARY REPORT              ")
print("==========================================")
for name, status, detail in results:
    print(f"{name:<45} | {status:<4} | {detail}")
