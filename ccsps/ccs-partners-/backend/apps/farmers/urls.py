from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import FarmerProfileViewSet, FarmerVisitViewSet

router = DefaultRouter()
router.register(r'profiles', FarmerProfileViewSet, basename='farmerprofile')
router.register(r'visits', FarmerVisitViewSet, basename='farmervisit')

urlpatterns = [
    path('', include(router.urls)),
]
