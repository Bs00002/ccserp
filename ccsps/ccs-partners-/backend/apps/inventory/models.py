import uuid
from django.db import models
from apps.products.models import Product

class Warehouse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True, null=True)
    manager = models.CharField(max_length=255, blank=True, null=True)
    
    def __str__(self):
        return self.name

class Godown(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='godowns')
    name = models.CharField(max_length=255)
    
    def __str__(self):
        return f"{self.warehouse.name} - {self.name}"

class StockType(models.TextChoices):
    OPENING = 'Opening', 'Opening'
    PURCHASE = 'Purchase', 'Purchase'
    PRODUCTION = 'Production', 'Production'
    TRANSFER = 'Transfer', 'Transfer'
    DAMAGE = 'Damage', 'Damage'
    EXPIRY = 'Expiry', 'Expiry'
    SALE = 'Sale', 'Sale'

class StockLedger(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_ledger')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='stock_ledger')
    godown = models.ForeignKey(Godown, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_ledger')
    
    type = models.CharField(max_length=20, choices=StockType.choices)
    quantity = models.IntegerField()
    reference = models.CharField(max_length=255, blank=True, null=True, help_text="Order or Batch ID")
    remarks = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.product.name} - {self.type} - {self.quantity}"
