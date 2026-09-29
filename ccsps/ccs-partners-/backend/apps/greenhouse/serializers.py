from rest_framework import serializers
from .models import ProjectLead, SubsidyLoanStatus, ProjectExecution, MaintenanceService, CropAdvisory
from apps.accounts.serializers import UserSerializer

class SubsidyLoanStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubsidyLoanStatus
        fields = '__all__'

class MaintenanceServiceSerializer(serializers.ModelSerializer):
    technician_details = UserSerializer(source='technician', read_only=True)
    class Meta:
        model = MaintenanceService
        fields = '__all__'

class CropAdvisorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CropAdvisory
        fields = '__all__'

class ProjectExecutionSerializer(serializers.ModelSerializer):
    services = MaintenanceServiceSerializer(many=True, read_only=True)
    crop_advisories = CropAdvisorySerializer(many=True, read_only=True)
    class Meta:
        model = ProjectExecution
        fields = '__all__'

class ProjectLeadSerializer(serializers.ModelSerializer):
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    subsidy_loan = SubsidyLoanStatusSerializer(read_only=True)
    execution = ProjectExecutionSerializer(read_only=True)
    
    class Meta:
        model = ProjectLead
        fields = '__all__'
