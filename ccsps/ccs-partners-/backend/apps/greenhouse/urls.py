from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    ProjectLeadViewSet, SubsidyLoanStatusViewSet,
    ProjectExecutionViewSet, MaintenanceServiceViewSet, CropAdvisoryViewSet
)

router = DefaultRouter()
router.register(r'leads', ProjectLeadViewSet, basename='projectlead')
router.register(r'subsidy', SubsidyLoanStatusViewSet, basename='subsidy')
router.register(r'execution', ProjectExecutionViewSet, basename='execution')
router.register(r'services', MaintenanceServiceViewSet, basename='service')
router.register(r'advisory', CropAdvisoryViewSet, basename='advisory')

urlpatterns = [
    path('', include(router.urls)),
]
