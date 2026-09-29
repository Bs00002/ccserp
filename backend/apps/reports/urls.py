from django.urls import path
from .views import generate_report, dashboard_summary

urlpatterns = [
    path('generate/', generate_report, name='generate_report'),
    path('dashboard/', dashboard_summary, name='dashboard_summary'),
]
