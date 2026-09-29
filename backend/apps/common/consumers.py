import json
import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger(__name__)

class ERPEventsConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            logger.warning("Rejecting unauthenticated WebSocket connection attempt.")
            await self.close(code=4001)
            return

        self.user_group = f"user_{str(user.id)}"
        self.role_group = f"role_{user.role}"
        self.joined_groups = [self.user_group, self.role_group]

        # Normalize Admin / Super Admin
        if user.role in ['Admin', 'Super Admin']:
            admin_group = "role_Admin"
            if admin_group not in self.joined_groups:
                self.joined_groups.append(admin_group)

        # Normalize Distributor / Employee
        if user.role in ['Distributor', 'Employee']:
            dist_group = "role_Distributor"
            if dist_group not in self.joined_groups:
                self.joined_groups.append(dist_group)

        # Join groups in channel layer
        for group in self.joined_groups:
            await self.channel_layer.group_add(group, self.channel_name)

        await self.accept()
        logger.info(f"WebSocket connected for user {user.email} (Role: {user.role}) on groups {self.joined_groups}")

        # Send initial confirmation
        await self.send_json({
            "type": "connection.established",
            "event": "connection.established",
            "payload": {
                "user_id": str(user.id),
                "email": user.email,
                "role": user.role,
                "groups": self.joined_groups
            }
        })

    async def disconnect(self, close_code):
        if hasattr(self, 'joined_groups'):
            for group in self.joined_groups:
                await self.channel_layer.group_discard(group, self.channel_name)
        logger.info(f"WebSocket disconnected with code {close_code}")

    async def receive_json(self, content):
        # Handle ping/keepalive from client
        msg_type = content.get("type") or content.get("event")
        if msg_type == "ping":
            await self.send_json({"type": "pong", "event": "pong", "payload": {}})

    async def erp_event(self, event):
        """Handler for events broadcast from broadcast_erp_event"""
        await self.send_json({
            "type": event.get("event"),
            "event": event.get("event"),
            "payload": event.get("payload", {}),
            "timestamp": event.get("timestamp")
        })
