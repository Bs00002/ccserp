from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SchemeViewSet, LoyaltyPointViewSet

router = DefaultRouter()
router.register(r'schemes', SchemeViewSet, basename='scheme')
router.register(r'loyalty-points', LoyaltyPointViewSet, basename='loyalty_point')

urlpatterns = [
    path('', include(router.urls)),
]
