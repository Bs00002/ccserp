from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WalletViewSet, LedgerEntryViewSet

router = DefaultRouter()
router.register(r'wallets', WalletViewSet, basename='wallet')
router.register(r'ledger', LedgerEntryViewSet, basename='ledger')

urlpatterns = [
    path('', include(router.urls)),
]
