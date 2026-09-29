from django.db import models
from django.conf import settings
from apps.common.models import BaseModel

class NotificationType(models.TextChoices):
    ORDER = 'Order', 'Order'
    REGISTRATION = 'Registration', 'Registration'
    APPROVAL = 'Approval', 'Approval'
    DISPATCH = 'Dispatch', 'Dispatch'
    EXPENSE = 'Expense', 'Expense'
    ATTENDANCE = 'Attendance', 'Attendance'
    SYSTEM = 'System', 'System'

class Notification(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=50, choices=NotificationType.choices, default=NotificationType.SYSTEM)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} - {self.user.email}"
