from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WarehouseViewSet, GodownViewSet, StockLedgerViewSet

router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')
router.register(r'godowns', GodownViewSet, basename='godown')
router.register(r'stock', StockLedgerViewSet, basename='stock_ledger')

urlpatterns = [
    path('', include(router.urls)),
]
