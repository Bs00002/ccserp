from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AttendanceViewSet, DealerVisitViewSet, ExpenseViewSet,
    LocationTrackViewSet, DailyTourPlanViewSet, SalesTargetViewSet
)

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'visits', DealerVisitViewSet, basename='visit')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'locations', LocationTrackViewSet, basename='location')
router.register(r'tour-plans', DailyTourPlanViewSet, basename='tour_plan')
router.register(r'targets', SalesTargetViewSet, basename='target')

urlpatterns = [
    path('', include(router.urls)),
]
