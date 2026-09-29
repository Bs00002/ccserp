from django.db import models
from apps.common.models import BaseModel
from apps.accounts.models import User

class Lead(BaseModel):
    SOURCE_CHOICES = (
        ('Call', 'Call'),
        ('WhatsApp', 'WhatsApp'),
        ('Meeting', 'Meeting'),
        ('Website', 'Website'),
        ('Reference', 'Reference')
    )
    STATUS_CHOICES = (
        ('New Inquiry', 'New Inquiry'),
        ('Follow Up', 'Follow Up'),
        ('Quotation Sent', 'Quotation Sent'),
        ('Won', 'Won'),
        ('Lost', 'Lost')
    )
    
    client_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES, default='Call')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='New Inquiry')
    
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='crm_leads')
    requirements = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Lead: {self.client_name}"

class Quotation(BaseModel):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='quotations')
    quotation_number = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    document = models.FileField(upload_to='crm/quotations/', null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)

class FollowUp(BaseModel):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='followups')
    followup_date = models.DateField(auto_now_add=True)
    next_followup_date = models.DateField(null=True, blank=True)
    remarks = models.TextField()
    handled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
