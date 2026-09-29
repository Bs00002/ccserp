import uuid
import random
from django.db import models
from apps.accounts.models import User
from apps.products.models import Product

class OrderStatus(models.TextChoices):
    DRAFT = 'Draft', 'Draft'
    SUBMITTED = 'Submitted', 'Submitted'
    PENDING_APPROVAL = 'Pending Approval', 'Pending Approval'
    APPROVED = 'Approved', 'Approved'
    REJECTED = 'Rejected', 'Rejected'
    BILTY_UPLOADED = 'Bilty Uploaded', 'Bilty Uploaded'
    READY_DISPATCH = 'Ready to Dispatch', 'Ready to Dispatch'
    DISPATCHED = 'Dispatched', 'Dispatched'
    DELIVERED = 'Delivered', 'Delivered'
    CANCELLED = 'Cancelled', 'Cancelled'

class PaymentStatus(models.TextChoices):
    PENDING = 'Pending', 'Pending'
    PAID = 'Paid', 'Paid'

def generate_order_number():
    return f"ORD-{random.randint(100000, 999999)}"

class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=50, unique=True, default=generate_order_number)
    
    dealer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dealer_orders')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_orders')
    
    order_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=30, choices=OrderStatus.choices, default=OrderStatus.PENDING_APPROVAL)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    gst_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    payment_terms = models.CharField(max_length=100, blank=True, null=True, default='Cash (15 Days)')
    remarks = models.TextField(blank=True, null=True)
    
    # Bilty Tracking (Office Stage)
    bilty_number = models.CharField(max_length=100, blank=True, null=True)
    bilty_pdf = models.FileField(upload_to='logistics/bilty/', blank=True, null=True)
    bilty_date = models.DateTimeField(blank=True, null=True)
    bilty_uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='bilty_orders')

    # LR Tracking (Warehouse Stage)
    transport_details = models.TextField(blank=True, null=True)
    vehicle_number = models.CharField(max_length=50, blank=True, null=True)
    lr_number = models.CharField(max_length=100, blank=True, null=True)
    lr_receipt_upload = models.FileField(upload_to='logistics/lr/', blank=True, null=True)
    lr_date = models.DateTimeField(blank=True, null=True)
    lr_generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='lr_orders')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.order_number

class OrderTimeline(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='timeline')
    status = models.CharField(max_length=50)
    remarks = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.order.order_number} - {self.status}"

class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    
    quantity = models.PositiveIntegerField(default=1)
    rate = models.DecimalField(max_digits=10, decimal_places=2) # Dealer price at time of order
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    gst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    
    total = models.DecimalField(max_digits=12, decimal_places=2) # Includes GST and discount

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.order.order_number} - {self.product.name}"

class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='invoice')
    invoice_number = models.CharField(max_length=50, unique=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    pdf = models.FileField(upload_to='invoices/pdf/', blank=True, null=True)
    
    def __str__(self):
        return self.invoice_number
