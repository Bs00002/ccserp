import os
import sys
import django

sys.path.insert(0, os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccs_backend.settings')
django.setup()

from rest_framework.test import APIClient

c = APIClient()

# Test 1: Valid DB login - Dealer
r1 = c.post('/api/auth/login/', {'email_or_username': 'master_dealer@ccs.com', 'password': 'DealerPass123!'})
assert r1.status_code == 200, f'Expected 200, got {r1.status_code}'
d1 = r1.json()
assert d1['user']['role'] == 'Dealer', f"Expected Dealer, got {d1['user']['role']}"
assert 'access_token' in d1 and len(d1['access_token']) > 20
print('TEST 1 PASSED: Valid Dealer login returns 200, valid JWT and role Dealer')

# Test 1b: Valid DB login - Admin
r1b = c.post('/api/auth/login/', {'email_or_username': 'master_admin@ccs.com', 'password': 'AdminPass123!'})
assert r1b.status_code == 200
assert r1b.json()['user']['role'] == 'Admin'
print('TEST 1b PASSED: Valid Admin login returns 200 and role Admin')

# Test 1c: Valid DB login - Distributor / Field
r1c = c.post('/api/auth/login/', {'email_or_username': 'master_emp@ccs.com', 'password': 'EmpPass123!'})
assert r1c.status_code == 200
assert r1c.json()['user']['role'] == 'Distributor'
print('TEST 1c PASSED: Valid Distributor login returns 200 and role Distributor')

# Test 2: Wrong password rejection
r2 = c.post('/api/auth/login/', {'email_or_username': 'master_dealer@ccs.com', 'password': 'WrongPassword999!'})
assert r2.status_code == 401
assert 'error' in r2.json()
print('TEST 2 PASSED: Wrong password correctly rejected with 401 Unauthorized')

# Test 2b: Non-existent user rejection
r2b = c.post('/api/auth/login/', {'email_or_username': 'non_existent@ccs.com', 'password': 'SomePassword123!'})
assert r2b.status_code == 401
print('TEST 2b PASSED: Non-existent user rejected with 401 Unauthorized')

# Test 4: Token refresh endpoint
r4 = c.post('/api/auth/token/refresh/', {'refresh': d1['refresh_token']})
assert r4.status_code == 200, f'Expected 200, got {r4.status_code}'
assert 'access' in r4.json()
print('TEST 4 PASSED: Token refresh endpoint issues new access token')

print('\nALL BACKEND AUTH TESTS PASSED PERFECTLY!')
