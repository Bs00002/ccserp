from django.db import models
from apps.common.models import BaseModel
from django.conf import settings
from apps.accounts.models import User

class ProjectLead(BaseModel):
    STATUS_CHOICES = (
        ('New', 'New'),
        ('Site Visit', 'Site Visit'),
        ('Quotation', 'Quotation'),
        ('Subsidy/Loan', 'Subsidy/Loan Approval'),
        ('Approved', 'Approved'),
        ('Lost', 'Lost')
    )
    farmer_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    village = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    land_area = models.CharField(max_length=50) # e.g. "2 Acres"
    
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='greenhouse_leads')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='New')
    
    # Site Visit Details
    site_visit_date = models.DateField(null=True, blank=True)
    gps_location = models.CharField(max_length=255, blank=True, null=True)
    farmer_photo = models.ImageField(upload_to='greenhouse/leads/', null=True, blank=True)
    land_survey_doc = models.FileField(upload_to='greenhouse/leads/surveys/', null=True, blank=True)
    
    # Quotation
    quotation_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    quotation_doc = models.FileField(upload_to='greenhouse/leads/quotations/', null=True, blank=True)

    def __str__(self):
        return f"{self.farmer_name} - {self.village}"

class SubsidyLoanStatus(BaseModel):
    lead = models.OneToOneField(ProjectLead, on_delete=models.CASCADE, related_name='subsidy_loan')
    subsidy_applied = models.BooleanField(default=False)
    subsidy_status = models.CharField(max_length=100, blank=True, null=True)
    bank_loan_applied = models.BooleanField(default=False)
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    loan_status = models.CharField(max_length=100, blank=True, null=True)
    approval_date = models.DateField(null=True, blank=True)

class ProjectExecution(BaseModel):
    lead = models.OneToOneField(ProjectLead, on_delete=models.CASCADE, related_name='execution')
    design_doc = models.FileField(upload_to='greenhouse/designs/', null=True, blank=True)
    
    construction_start_date = models.DateField(null=True, blank=True)
    expected_completion_date = models.DateField(null=True, blank=True)
    actual_completion_date = models.DateField(null=True, blank=True)
    
    # Material Dispatch Tracking
    material_dispatched = models.BooleanField(default=False)
    dispatch_date = models.DateField(null=True, blank=True)
    
    status = models.CharField(max_length=50, default='Designing', choices=(
        ('Designing', 'Designing'),
        ('Material Dispatch', 'Material Dispatch'),
        ('Installation', 'Installation'),
        ('Completed', 'Completed')
    ))

class MaintenanceService(BaseModel):
    project = models.ForeignKey(ProjectExecution, on_delete=models.CASCADE, related_name='services')
    visit_date = models.DateField()
    technician = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='service_visits')
    is_complaint = models.BooleanField(default=False)
    complaint_details = models.TextField(blank=True, null=True)
    action_taken = models.TextField()
    is_amc = models.BooleanField(default=False)
    next_visit_due = models.DateField(null=True, blank=True)

class CropAdvisory(BaseModel):
    project = models.ForeignKey(ProjectExecution, on_delete=models.CASCADE, related_name='crop_advisories')
    crop_name = models.CharField(max_length=100)
    advisory_date = models.DateField(auto_now_add=True)
    recommendations = models.TextField()
    # Optional integrations info
    has_automation = models.BooleanField(default=False)
    has_drip = models.BooleanField(default=False)
    has_fan_pad = models.BooleanField(default=False)
