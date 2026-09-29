from django.urls import path
from .admin_views import (
    DashboardStatsView, ApprovalsListView, ApprovalActionView, 
    UserManagementListView, UserManagementDetailView, ApprovalDetailView
)

urlpatterns = [
    path('dashboard/stats/', DashboardStatsView.as_view(), name='admin_dashboard_stats'),
    path('approvals/', ApprovalsListView.as_view(), name='admin_approvals_list'),
    path('approvals/<uuid:user_id>/', ApprovalDetailView.as_view(), name='admin_approval_detail'),
    path('approvals/<uuid:user_id>/<str:action>/', ApprovalActionView.as_view(), name='admin_approval_action'),
    path('users/', UserManagementListView.as_view(), name='admin_user_management_list'),
    path('users/<uuid:user_id>/', UserManagementDetailView.as_view(), name='admin_user_management_detail'),
]
