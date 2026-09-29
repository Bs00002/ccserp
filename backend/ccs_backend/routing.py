from django.urls import re_path
from apps.common.consumers import ERPEventsConsumer

websocket_urlpatterns = [
    re_path(r"^ws/events/?$", ERPEventsConsumer.as_asgi()),
]
