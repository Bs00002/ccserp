from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComplaintViewSet, ReturnRequestViewSet, EnquiryViewSet

router = DefaultRouter()
router.register(r'complaints', ComplaintViewSet, basename='complaint')
router.register(r'returns', ReturnRequestViewSet, basename='return')
router.register(r'enquiries', EnquiryViewSet, basename='enquiry')

urlpatterns = [
    path('', include(router.urls)),
]
