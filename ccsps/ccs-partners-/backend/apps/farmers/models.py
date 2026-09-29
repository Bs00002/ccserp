from django.db import models
from apps.common.models import BaseModel
from apps.accounts.models import User

class FarmerProfile(BaseModel):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    village = models.CharField(max_length=100)
    taluka = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=100)
    state = models.CharField(max_length=100, default='Gujarat')
    
    land_area = models.CharField(max_length=50, blank=True, null=True)
    crop = models.CharField(max_length=100, blank=True, null=True)
    season = models.CharField(max_length=100, blank=True, null=True)
    
    # Associated Field Staff / Dealer
    associated_dealer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='farmers', limit_choices_to={'role': 'Dealer'})
    
    def __str__(self):
        return f"{self.name} ({self.village})"

class FarmerVisit(BaseModel):
    farmer = models.ForeignKey(FarmerProfile, on_delete=models.CASCADE, related_name='visits')
    visited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='farmer_visits')
    visit_date = models.DateField(auto_now_add=True)
    
    problems_reported = models.TextField(blank=True, null=True)
    recommendations_given = models.TextField(blank=True, null=True)
    
    # Is there a greenhouse interest?
    greenhouse_interest = models.BooleanField(default=False)
    
    # Order value if an order was taken directly
    order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    def __str__(self):
        return f"Visit to {self.farmer.name} by {self.visited_by.get_full_name()}"
