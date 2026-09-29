import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class BaseModel(models.Model):
  id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)
  deleted_at = models.DateTimeField(null=True, blank=True)
  created_by = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    null=True,
    blank=True,
    on_delete=models.SET_NULL,
    related_name='%(class)s_created_by'
  )
  updated_by = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    null=True,
    blank=True,
    on_delete=models.SET_NULL,
    related_name='%(class)s_updated_by'
  )
  deleted_by = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    null=True,
    blank=True,
    on_delete=models.SET_NULL,
    related_name='%(class)s_deleted_by'
  )
  is_deleted = models.BooleanField(default=False)

  class Meta:
    abstract = True

  def soft_delete(self, *, deleted_by=None):
    if self.is_deleted:
      return
    self.is_deleted = True
    self.deleted_at = timezone.now()
    if deleted_by is not None:
      self.deleted_by = deleted_by
    self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by', 'updated_at'])

class CompanyProfile(BaseModel):
    name = models.CharField(max_length=255, default='CCS Partners')
    logo = models.ImageField(upload_to='company/', null=True, blank=True)
    gst_number = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    bank_details = models.TextField(blank=True, null=True)
    invoice_prefix = models.CharField(max_length=10, default='INV')
    email_settings = models.JSONField(default=dict, blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Company Profile'

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50) # Login, Create, Update, Delete
    module = models.CharField(max_length=100) # Module name
    details = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device = models.CharField(max_length=255, blank=True, null=True)
    browser = models.CharField(max_length=255, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user} - {self.action} at {self.timestamp}"

