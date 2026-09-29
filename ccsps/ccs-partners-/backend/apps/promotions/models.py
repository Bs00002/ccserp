import uuid
from django.db import models
from apps.accounts.models import User
from apps.products.models import Product

class SchemeType(models.TextChoices):
    BUY_X_GET_Y = 'Buy X Get Y', 'Buy X Get Y'
    CASH_DISCOUNT = 'Cash Discount', 'Cash Discount'
    TARGET_BONUS = 'Target Bonus', 'Target Bonus'

class Scheme(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    scheme_type = models.CharField(max_length=50, choices=SchemeType.choices)
    
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Targeting
    applicable_to = models.ManyToManyField(Product, blank=True)
    dealer_specific = models.ManyToManyField(User, blank=True, limit_choices_to={'role': 'Dealer'})
    
    # Logic
    min_quantity = models.IntegerField(default=0)
    free_quantity = models.IntegerField(default=0)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class LoyaltyPoint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dealer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='loyalty_points')
    points = models.IntegerField()
    source = models.CharField(max_length=255, help_text="Order ID or Scheme Name")
    type = models.CharField(max_length=20, choices=[('Earned', 'Earned'), ('Redeemed', 'Redeemed')])
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.dealer.email} - {self.points} {self.type}"
