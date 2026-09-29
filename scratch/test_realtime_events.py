import os
import sys
import asyncio
import json
import django

# Setup Django environment
sys.path.insert(0, os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccs_backend.settings')
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.test import APIClient
from channels.testing import WebsocketCommunicator
from ccs_backend.asgi import application
from apps.orders.models import Order, OrderItem
from apps.products.models import Product

User = get_user_model()

def get_token(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)

async def wait_for_event(communicator, expected_type, timeout=5):
    """
    Waits for a specific event type on a WebSocket communicator, ignoring intermediate
    notifications or connection events.
    """
    start = asyncio.get_event_loop().time()
    received_types = []
    while asyncio.get_event_loop().time() - start < timeout:
        if not await communicator.receive_nothing():
            event = await communicator.receive_json_from()
            ev_type = event.get('type') or event.get('event')
            received_types.append(ev_type)
            if ev_type == expected_type:
                return event
        await asyncio.sleep(0.05)
    raise TimeoutError(f"Did not receive expected event '{expected_type}' within {timeout}s. Received: {received_types}")

async def run_realtime_audit():
    print("=" * 65)
    print("CCS CONNECT — REAL-TIME WEBSOCKET & REDIS ISOLATION AUDIT")
    print("=" * 65)

    # 1. Prepare Users
    admin_user = User.objects.filter(role__in=['Admin', 'Super Admin'], is_active=True).first()
    emp_user = User.objects.filter(role__in=['Employee', 'Distributor'], is_active=True).first()
    wh_user = User.objects.filter(role='Warehouse', is_active=True).first()
    
    dealers = list(User.objects.filter(role='Dealer', is_active=True))
    if len(dealers) < 2:
        raise Exception("Need at least 2 dealers for isolation testing")
    dealer_a = dealers[0]
    dealer_b = dealers[1]

    print(f"Users Initialized:")
    print(f"  Admin: {admin_user.email} (Role: {admin_user.role})")
    print(f"  Employee/Distributor: {emp_user.email} (Role: {emp_user.role})")
    print(f"  Warehouse: {wh_user.email} (Role: {wh_user.role})")
    print(f"  Dealer A: {dealer_a.email} (ID: {dealer_a.id})")
    print(f"  Dealer B: {dealer_b.email} (ID: {dealer_b.id})")
    print()

    # 2. Establish Authenticated WebSocket Communicators
    print("--- CONNECTING WEBSOCKET COMMUNICATORS ---")
    comm_admin = WebsocketCommunicator(application, f"/ws/events/?token={get_token(admin_user)}")
    connected_admin, _ = await comm_admin.connect()
    assert connected_admin, "Admin WebSocket failed to connect"
    _ = await comm_admin.receive_json_from()
    print("  [OK] Admin WebSocket Connected")

    comm_emp = WebsocketCommunicator(application, f"/ws/events/?token={get_token(emp_user)}")
    connected_emp, _ = await comm_emp.connect()
    assert connected_emp, "Employee WebSocket failed to connect"
    _ = await comm_emp.receive_json_from()
    print("  [OK] Employee WebSocket Connected")

    comm_wh = WebsocketCommunicator(application, f"/ws/events/?token={get_token(wh_user)}")
    connected_wh, _ = await comm_wh.connect()
    assert connected_wh, "Warehouse WebSocket failed to connect"
    _ = await comm_wh.receive_json_from()
    print("  [OK] Warehouse WebSocket Connected")

    comm_dealer_a = WebsocketCommunicator(application, f"/ws/events/?token={get_token(dealer_a)}")
    connected_da, _ = await comm_dealer_a.connect()
    assert connected_da, "Dealer A WebSocket failed to connect"
    _ = await comm_dealer_a.receive_json_from()
    print("  [OK] Dealer A WebSocket Connected")

    comm_dealer_b = WebsocketCommunicator(application, f"/ws/events/?token={get_token(dealer_b)}")
    connected_db, _ = await comm_dealer_b.connect()
    assert connected_db, "Dealer B WebSocket failed to connect"
    _ = await comm_dealer_b.receive_json_from()
    print("  [OK] Dealer B WebSocket Connected")

    # Unauthenticated / Invalid token rejection check
    comm_unauth = WebsocketCommunicator(application, f"/ws/events/?token=invalid_token_123")
    connected_unauth, _ = await comm_unauth.connect()
    assert not connected_unauth, "Unauthenticated connection must be rejected"
    print("  [OK] Unauthenticated WebSocket Connection correctly rejected")
    print()

    client = APIClient()

    # -------------------------------------------------------------
    # SCENARIO 1: Employee creates order -> Admin receives order.created
    # -------------------------------------------------------------
    print("--- SCENARIO 1: Employee Creates Order -> Admin Real-Time Event ---")
    client.force_authenticate(user=emp_user)
    product = Product.objects.first()
    
    order_data = {
        "dealer": str(dealer_a.id),
        "remarks": "Real-time verification order",
        "items": [
            {
                "product": str(product.id),
                "quantity": 5,
                "rate": float(product.dealer_price or 100)
            }
        ]
    }
    
    res = client.post('/api/orders/orders/', order_data, format='json')
    assert res.status_code == 201, f"Order creation failed: {res.data}"
    created_order = res.data
    order_id = created_order['id']
    order_number = created_order.get('order_number', f"ORD-{order_id}")
    print(f"  Order created: {order_number} (ID: {order_id})")

    # Admin receives order.created event
    admin_event = await wait_for_event(comm_admin, 'order.created')
    print(f"  Admin received WS event: type={admin_event.get('type')}, order_id={admin_event.get('payload', {}).get('id')}")
    assert admin_event['type'] == 'order.created'
    assert admin_event['payload']['id'] == order_id
    print("  [PASS] SCENARIO 1: Admin successfully received 'order.created' event in real time without refresh!")
    print()

    # -------------------------------------------------------------
    # SCENARIO 2: Admin approves order -> Employee receives order.approved
    # -------------------------------------------------------------
    print("--- SCENARIO 2: Admin Approves Order -> Employee Real-Time Event ---")
    client.force_authenticate(user=admin_user)
    res_app = client.post(f'/api/orders/orders/{order_id}/approve/')
    assert res_app.status_code == 200, f"Approval failed: {res_app.data}"

    # Employee receives order.approved event
    emp_event = await wait_for_event(comm_emp, 'order.approved')
    print(f"  Employee received WS event: type={emp_event.get('type')}, status={emp_event.get('payload', {}).get('status')}")
    assert emp_event['type'] == 'order.approved'
    assert emp_event['payload']['id'] == order_id
    print("  [PASS] SCENARIO 2: Employee successfully received 'order.approved' update in real time without refresh!")
    print()

    # -------------------------------------------------------------
    # SCENARIO 3: Admin generates Bilty -> Warehouse receives order.bilty_created
    # -------------------------------------------------------------
    print("--- SCENARIO 3: Admin Generates Bilty -> Warehouse Real-Time Event ---")
    client.force_authenticate(user=admin_user)
    bilty_no = f"BILTY-RT-{order_id[:8]}"
    res_bilty = client.post(f'/api/orders/orders/{order_id}/generate_bilty/', {
        "bilty_number": bilty_no,
        "transporter_name": "VRL Logistics"
    }, format='multipart')
    assert res_bilty.status_code == 200, f"Bilty generation failed: {res_bilty.data}"

    # Warehouse receives order.bilty_created event
    wh_event = await wait_for_event(comm_wh, 'order.bilty_created')
    print(f"  Warehouse received WS event: type={wh_event.get('type')}, bilty_number={wh_event.get('payload', {}).get('bilty_number')}")
    assert wh_event['type'] == 'order.bilty_created'
    assert wh_event['payload']['id'] == order_id
    assert wh_event['payload']['bilty_number'] == bilty_no
    print("  [PASS] SCENARIO 3: Warehouse successfully received 'order.bilty_created' event in real time!")
    print()

    # -------------------------------------------------------------
    # SCENARIO 4: Warehouse saves LR -> Admin & Employee receive order.lr_created
    # -------------------------------------------------------------
    print("--- SCENARIO 4: Warehouse Saves LR -> Admin Receives order.lr_created ---")
    client.force_authenticate(user=wh_user)
    lr_no = f"LR-RT-{order_id[:8]}"
    res_lr = client.post(f'/api/orders/orders/{order_id}/generate_lr/', {
        "lr_number": lr_no,
        "transport_details": "VRL Express",
        "vehicle_number": "GJ-01-XX-1234"
    }, format='multipart')
    assert res_lr.status_code == 200, f"LR creation failed: {res_lr.data}"

    # Admin receives order.lr_created event
    admin_lr_event = await wait_for_event(comm_admin, 'order.lr_created')
    print(f"  Admin received WS event: type={admin_lr_event.get('type')}, lr_number={admin_lr_event.get('payload', {}).get('lr_number')}")
    assert admin_lr_event['type'] == 'order.lr_created'
    assert admin_lr_event['payload']['id'] == order_id
    assert admin_lr_event['payload']['lr_number'] == lr_no

    # Employee also receives order.lr_created event
    emp_lr_event = await wait_for_event(comm_emp, 'order.lr_created')
    assert emp_lr_event['type'] == 'order.lr_created'
    print("  [PASS] SCENARIO 4: Admin & Employee received 'order.lr_created' event in real time!")
    print()

    # -------------------------------------------------------------
    # SCENARIO 5: Warehouse dispatches order -> Admin & Employee receive order.dispatched
    # -------------------------------------------------------------
    print("--- SCENARIO 5: Warehouse Dispatches Order -> Admin & Employee Real-Time Event ---")
    client.force_authenticate(user=wh_user)
    res_disp = client.post(f'/api/orders/orders/{order_id}/dispatch_order/')
    assert res_disp.status_code == 200, f"Dispatch failed: {res_disp.data}"

    # Admin receives order.dispatched event
    admin_disp_event = await wait_for_event(comm_admin, 'order.dispatched')
    assert admin_disp_event['type'] == 'order.dispatched'
    assert admin_disp_event['payload']['status'] == 'Dispatched'

    # Employee receives order.dispatched event
    emp_disp_event = await wait_for_event(comm_emp, 'order.dispatched')
    assert emp_disp_event['type'] == 'order.dispatched'
    print(f"  Admin & Employee received WS event: type={admin_disp_event.get('type')}, status={admin_disp_event.get('payload', {}).get('status')}")
    print("  [PASS] SCENARIO 5: Admin & Employee successfully received 'order.dispatched' in real time!")
    print()

    # -------------------------------------------------------------
    # SCENARIO 6: Data & Tenant Isolation Test
    # Dealer A collection / payment must NEVER be received by Dealer B!
    # -------------------------------------------------------------
    print("--- SCENARIO 6: STRICT ROLE & TENANT ISOLATION AUDIT ---")
    print(f"  Creating payment / collection for Dealer A ({dealer_a.email})...")
    
    # Drain any pending messages on Dealer A and Dealer B
    while not await comm_dealer_a.receive_nothing():
        await comm_dealer_a.receive_json_from(timeout=1)
    while not await comm_dealer_b.receive_nothing():
        await comm_dealer_b.receive_json_from(timeout=1)

    client.force_authenticate(user=admin_user)
    res_pay = client.post('/api/wallet/ledger/', {
        "dealer": str(dealer_a.id),
        "amount": "25000.00",
        "payment_method": "NEFT",
        "reference": f"NEFT-ISOLATION-{os.urandom(4).hex().upper()}",
        "notes": "Dealer A Private Collection"
    }, format='json')
    assert res_pay.status_code == 201, f"Payment creation failed: {res_pay.data}"

    # Dealer A MUST receive payment.created
    da_event = await wait_for_event(comm_dealer_a, 'payment.created')
    print(f"  Dealer A received private event: type={da_event.get('type')}, amount={da_event.get('payload', {}).get('amount')}")
    assert da_event['type'] == 'payment.created'
    assert float(da_event['payload']['amount']) == 25000.0

    # Dealer B MUST NEVER receive Dealer A's private event!
    dealer_b_got_nothing = await comm_dealer_b.receive_nothing(timeout=2)
    assert dealer_b_got_nothing, "SECURITY VIOLATION: Dealer B received Dealer A's private payment event!"
    print("  [PASS] SECURITY VERIFIED: Dealer B received ZERO events (100% isolated from Dealer A)!")
    print()

    # -------------------------------------------------------------
    # SCENARIO 7: Stock Movement Update
    # -------------------------------------------------------------
    print("--- SCENARIO 7: Warehouse Stock Movement -> Warehouse & Admin Real-Time Event ---")
    client.force_authenticate(user=wh_user)
    res_stock = client.post('/api/inventory/stock/', {
        "product": str(product.id),
        "movement_type": "Purchase",
        "quantity": 100,
        "reference": "PO-RT-TEST-001"
    })
    assert res_stock.status_code == 201, f"Stock update failed: {res_stock.data}"

    wh_stock_event = await wait_for_event(comm_wh, 'stock.updated')
    assert wh_stock_event['type'] == 'stock.updated'
    admin_stock_event = await wait_for_event(comm_admin, 'stock.updated')
    assert admin_stock_event['type'] == 'stock.updated'
    print(f"  Warehouse & Admin received WS event: type={wh_stock_event.get('type')}, qty={wh_stock_event.get('payload', {}).get('quantity')}")
    print("  [PASS] SCENARIO 7: Stock movement event received in real time!")
    print()

    # -------------------------------------------------------------
    # SCENARIO 8: Notification Created
    # -------------------------------------------------------------
    print("--- SCENARIO 8: Notification Created -> Target User Notification Event ---")
    from apps.notifications.models import Notification
    
    notif = Notification.objects.create(
        user=dealer_a,
        title="Real-Time Order Update",
        message="Your order status has changed.",
        type="Order"
    )

    notif_event = await wait_for_event(comm_dealer_a, 'notification.created')
    assert notif_event['type'] == 'notification.created'
    assert notif_event['payload']['title'] == "Real-Time Order Update"
    print(f"  Dealer A received notification event: title='{notif_event['payload']['title']}'")
    print("  [PASS] SCENARIO 8: Notification created event received in real time!")
    print()

    # Clean up communicators
    await comm_admin.disconnect()
    await comm_emp.disconnect()
    await comm_wh.disconnect()
    await comm_dealer_a.disconnect()
    await comm_dealer_b.disconnect()

    print("=" * 65)
    print("ALL REAL-TIME WEBSOCKET & ISOLATION AUDIT TESTS PASSED 100%!")
    print("=" * 65)

if __name__ == '__main__':
    asyncio.run(run_realtime_audit())
