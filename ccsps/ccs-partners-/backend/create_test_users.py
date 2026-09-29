import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccs_backend.settings')
django.setup()

from apps.accounts.models import User, UserRole, UserStatus, DealerProfile, DistributorProfile

def get_or_create_user(email, role):
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': email.split('@')[0],
            'role': role,
            'status': UserStatus.APPROVED,
            'is_verified': True
        }
    )
    user.set_password('Testing@123')
    user.status = UserStatus.APPROVED
    user.is_verified = True
    user.save()
    
    if role == UserRole.DEALER and created:
        DealerProfile.objects.create(user=user, company_name=f"{email.split('@')[0]} Company")
    elif role == UserRole.DISTRIBUTOR and created:
        DistributorProfile.objects.create(user=user, company_name=f"{email.split('@')[0]} Company")

    return user

dealer = get_or_create_user('testdealer@example.com', UserRole.DEALER)
distributor = get_or_create_user('testdistributor@example.com', UserRole.DISTRIBUTOR)

print(f"DEALER_EMAIL={dealer.email}")
print(f"DEALER_PASSWORD=Testing@123")
print(f"DISTRIBUTOR_EMAIL={distributor.email}")
print(f"DISTRIBUTOR_PASSWORD=Testing@123")
