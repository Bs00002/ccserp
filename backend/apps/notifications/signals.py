from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.orders.models import Order
from apps.accounts.models import User
from .models import Notification, NotificationType
from apps.common.events import broadcast_erp_event

@receiver(post_save, sender=Order)
def order_notification(sender, instance, created, **kwargs):
    if kwargs.get('raw', False):
        return
    if created:
        # Notify admins
        admins = User.objects.filter(role__in=['Super Admin', 'Admin'])
        for admin in admins:
            Notification.objects.create(
                user=admin,
                title="New Order Received",
                message=f"Order #{instance.order_number} has been placed by {instance.dealer.get_full_name()}.",
                type=NotificationType.ORDER
            )
    else:
        # Status change
        if instance.status == 'Approved':
            Notification.objects.create(
                user=instance.dealer,
                title="Order Approved",
                message=f"Your order #{instance.order_number} has been approved.",
                type=NotificationType.APPROVAL
            )
        elif instance.status == 'Dispatched':
            Notification.objects.create(
                user=instance.dealer,
                title="Order Dispatched",
                message=f"Your order #{instance.order_number} has been dispatched.",
                type=NotificationType.DISPATCH
            )

@receiver(post_save, sender=User)
def user_registration_notification(sender, instance, created, **kwargs):
    if kwargs.get('raw', False):
        return
    if created and instance.role in ['Dealer', 'Distributor', 'Employee']:
        if not instance.is_active:
            admins = User.objects.filter(role__in=['Super Admin', 'Admin'])
            for admin in admins:
                Notification.objects.create(
                    user=admin,
                    title="New Registration Pending",
                    message=f"{instance.get_full_name()} has registered as {instance.role} and is waiting for approval.",
                    type=NotificationType.REGISTRATION
                )
        else:
            Notification.objects.create(
                user=instance,
                title="Welcome to CCS Partners ERP",
                message="Your account is active.",
                type=NotificationType.SYSTEM
            )

@receiver(post_save, sender=Notification)
def notification_broadcast(sender, instance, created, **kwargs):
    if kwargs.get('raw', False):
        return
    if created:
        broadcast_erp_event(
            event_type='notification.created',
            payload={
                "id": str(instance.id),
                "title": instance.title,
                "message": instance.message,
                "type": instance.type,
                "is_read": instance.is_read,
                "created_at": instance.created_at.isoformat() if hasattr(instance, 'created_at') and instance.created_at else None
            },
            target_user_ids=[str(instance.user_id)]
        )
