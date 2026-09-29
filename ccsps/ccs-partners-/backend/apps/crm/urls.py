from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import LeadViewSet, QuotationViewSet, FollowUpViewSet, DealerViewSet, DistributorViewSet

router = DefaultRouter()
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'quotations', QuotationViewSet, basename='quotation')
router.register(r'followups', FollowUpViewSet, basename='followup')
router.register(r'dealers', DealerViewSet, basename='dealer')
router.register(r'distributors', DistributorViewSet, basename='distributor')

urlpatterns = [
    path('', include(router.urls)),
]
