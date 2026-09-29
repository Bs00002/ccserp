import uuid
from django.db import models
from apps.accounts.models import User
from apps.orders.models import Order, OrderItem

class ComplaintCategory(models.TextChoices):
    LATE_DELIVERY = 'Late Delivery', 'Late Delivery'
    QUALITY = 'Quality', 'Quality'
    LEAKAGE = 'Leakage', 'Leakage'
    WRONG_PRODUCT = 'Wrong Product', 'Wrong Product'
    OTHER = 'Other', 'Other'

class ComplaintStatus(models.TextChoices):
    OPEN = 'Open', 'Open'
    IN_PROGRESS = 'In Progress', 'In Progress'
    RESOLVED = 'Resolved', 'Resolved'
    CLOSED = 'Closed', 'Closed'

class Complaint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dealer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints', null=True, blank=True)
    
    category = models.CharField(max_length=50, choices=ComplaintCategory.choices)
    description = models.TextField()
    photo = models.FileField(upload_to='support/complaints/', blank=True, null=True)
    video = models.FileField(upload_to='support/complaints_videos/', blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=ComplaintStatus.choices, default=ComplaintStatus.OPEN)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_complaints')
    resolution_timeline = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.category} - {self.status} by {self.dealer.email}"

class ReturnReason(models.TextChoices):
    DAMAGE = 'Damage', 'Damage'
    EXPIRY = 'Expiry', 'Expiry'
    WRONG_ITEM = 'Wrong Item', 'Wrong Item'
    OTHER = 'Other', 'Other'

class ReturnStatus(models.TextChoices):
    REQUESTED = 'Requested', 'Requested'
    APPROVED = 'Approved', 'Approved'
    REJECTED = 'Rejected', 'Rejected'
    REPLACED = 'Replaced', 'Replaced'
    REFUNDED = 'Refunded', 'Refunded'

class ReturnRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='returns')
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name='returns')
    dealer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='returns')
    
    reason = models.CharField(max_length=50, choices=ReturnReason.choices)
    description = models.TextField()
    quantity = models.PositiveIntegerField()
    photo = models.FileField(upload_to='support/returns/', blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=ReturnStatus.choices, default=ReturnStatus.REQUESTED)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_returns')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.order.order_number} - {self.reason} - {self.status}"

class Enquiry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    department = models.CharField(max_length=50)
    message = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} - {self.department}"
