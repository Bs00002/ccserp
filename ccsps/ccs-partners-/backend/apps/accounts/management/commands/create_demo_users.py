from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import UserRole, UserStatus, DealerProfile, DistributorProfile

User = get_user_model()

class Command(BaseCommand):
    help = 'Create or update permanent demo users for the system.'

    def handle(self, *args, **options):
        users_data = [
            {
                "email": "admin@ccsconnect.com",
                "username": "demo_admin",
                "password": "Admin@123",
                "role": UserRole.SUPER_ADMIN,
                "first_name": "Demo",
                "last_name": "Admin",
                "is_superuser": True,
                "is_staff": True
            },
            {
                "email": "distributor@ccsconnect.com",
                "username": "demo_distributor",
                "password": "Distributor@123",
                "role": UserRole.DISTRIBUTOR,
                "first_name": "Demo",
                "last_name": "Distributor",
                "is_superuser": False,
                "is_staff": False
            },
            {
                "email": "dealer@ccsconnect.com",
                "username": "demo_dealer",
                "password": "Dealer@123",
                "role": UserRole.DEALER,
                "first_name": "Demo",
                "last_name": "Dealer",
                "is_superuser": False,
                "is_staff": False
            }
        ]

        for data in users_data:
            email = data.pop('email')
            password = data.pop('password')
            role = data.get('role')
            
            user, created = User.objects.get_or_create(email=email, defaults=data)
            
            # Update attributes if it already exists or was just created
            user.set_password(password)
            user.status = UserStatus.APPROVED
            user.is_verified = True
            user.is_active = True
            
            # Update all fields from data explicitly to ensure changes persist
            for k, v in data.items():
                setattr(user, k, v)

            user.save()

            # Ensure related profile exists
            if role == UserRole.DEALER:
                DealerProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'company_name': 'Demo Dealer Agro',
                        'city': 'Demo City',
                        'state': 'Demo State'
                    }
                )
            elif role == UserRole.DISTRIBUTOR:
                DistributorProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'company_name': 'Demo Distributor Corp'
                    }
                )

            action = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{action} user {email} as {role}"))

        self.stdout.write(self.style.SUCCESS('Successfully seeded demo users!'))
