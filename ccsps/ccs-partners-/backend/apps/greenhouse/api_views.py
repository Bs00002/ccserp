from rest_framework import viewsets, permissions
from .models import ProjectLead, SubsidyLoanStatus, ProjectExecution, MaintenanceService, CropAdvisory
from .serializers import (
    ProjectLeadSerializer, SubsidyLoanStatusSerializer,
    ProjectExecutionSerializer, MaintenanceServiceSerializer,
    CropAdvisorySerializer
)

class ProjectLeadViewSet(viewsets.ModelViewSet):
    queryset = ProjectLead.objects.all().order_by('-created_at')
    serializer_class = ProjectLeadSerializer
    permission_classes = [permissions.IsAuthenticated]

class SubsidyLoanStatusViewSet(viewsets.ModelViewSet):
    queryset = SubsidyLoanStatus.objects.all()
    serializer_class = SubsidyLoanStatusSerializer
    permission_classes = [permissions.IsAuthenticated]

class ProjectExecutionViewSet(viewsets.ModelViewSet):
    queryset = ProjectExecution.objects.all()
    serializer_class = ProjectExecutionSerializer
    permission_classes = [permissions.IsAuthenticated]

class MaintenanceServiceViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceService.objects.all().order_by('-visit_date')
    serializer_class = MaintenanceServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

class CropAdvisoryViewSet(viewsets.ModelViewSet):
    queryset = CropAdvisory.objects.all().order_by('-advisory_date')
    serializer_class = CropAdvisorySerializer
    permission_classes = [permissions.IsAuthenticated]
