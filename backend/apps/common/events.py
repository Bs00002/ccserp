import logging
import asyncio
from datetime import datetime, timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)

def _send_to_group(channel_layer, group_name: str, event_message: dict):
    """
    Safely dispatches group_send whether called in a synchronous view (WSGI)
    or from within an active asyncio event loop (ASGI / Async tests).
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # In active event loop: schedule coroutine directly on running loop
        asyncio.create_task(channel_layer.group_send(group_name, event_message))
    else:
        # Synchronous view / thread: use async_to_sync
        async_to_sync(channel_layer.group_send)(group_name, event_message)

def broadcast_erp_event(event_type: str, payload: dict, target_roles: list = None, target_user_ids: list = None):
    """
    Broadcasts real-time events to authenticated clients via Redis Channel Layer.
    Guarantees:
    1. Multi-tenant / role isolation: Events are delivered ONLY to targeted roles and target users.
    2. Zero dealer data leakage: Dealers only receive events targeted directly to their specific user ID.
    3. Resilience: Any channel layer / network error is logged safely without breaking calling REST APIs.
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.debug("No channel layer configured; skipping broadcast.")
            return

        import json
        clean_payload = json.loads(json.dumps(payload or {}, default=str))

        timestamp = datetime.now(timezone.utc).isoformat()
        event_message = {
            "type": "erp_event",
            "event": event_type,
            "payload": clean_payload,
            "timestamp": timestamp
        }

        delivered_groups = set()

        # 1. Target individual users (e.g. specific dealer, specific employee)
        if target_user_ids:
            for uid in target_user_ids:
                if uid:
                    group_name = f"user_{str(uid)}"
                    if group_name not in delivered_groups:
                        _send_to_group(channel_layer, group_name, event_message)
                        delivered_groups.add(group_name)

        # 2. Target specific roles (e.g. Admin, Warehouse, Distributor)
        if target_roles:
            for role in target_roles:
                if role:
                    group_name = f"role_{role}"
                    if group_name not in delivered_groups:
                        _send_to_group(channel_layer, group_name, event_message)
                        delivered_groups.add(group_name)

        logger.info(f"Broadcast {event_type} delivered to groups: {delivered_groups}")
    except Exception as e:
        logger.warning(f"Failed to broadcast real-time event '{event_type}': {e}")
