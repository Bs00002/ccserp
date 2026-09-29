from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, InvoiceViewSet

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'invoices', InvoiceViewSet, basename='invoice')

orders_router = DefaultRouter()
orders_router.register(r'', OrderViewSet, basename='order-nested')

urlpatterns = [
    path('orders/orders/', include(orders_router.urls)),
    path('orders/invoices/', InvoiceViewSet.as_view({'get': 'list', 'post': 'create'}), name='order-invoices-alias'),
    path('orders/invoices/<uuid:pk>/', InvoiceViewSet.as_view({'get': 'retrieve'}), name='order-invoice-detail-alias'),
    path('orders/invoices/<uuid:pk>/generate_pdf/', InvoiceViewSet.as_view({'get': 'generate_pdf'}), name='order-invoice-pdf-alias'),
    path('', include(router.urls)),
]
