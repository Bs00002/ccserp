from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import UserRole, UserStatus, DealerProfile, DistributorProfile

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed standard ERP users for live production testing'

    def handle(self, *args, **options):
        # 1. Admin
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@ccs.com',
                'role': UserRole.ADMIN,
                'first_name': 'CCS',
                'last_name': 'Admin',
                'is_superuser': True,
                'is_staff': True,
                'status': UserStatus.APPROVED,
                'is_verified': True,
            }
        )
        admin.set_password('adminpass')
        admin.role = UserRole.ADMIN
        admin.status = UserStatus.APPROVED
        admin.is_verified = True
        admin.is_superuser = True
        admin.is_staff = True
        admin.save()
        self.stdout.write(self.style.SUCCESS('Seeded admin: admin / adminpass'))

        # 2. Employee / Salesman
        emp, created = User.objects.get_or_create(
            email='employee1@ccs.com',
            defaults={
                'username': 'employee1',
                'role': UserRole.DISTRIBUTOR,
                'first_name': 'Rajesh',
                'last_name': 'Kumar',
                'status': UserStatus.APPROVED,
                'is_verified': True,
            }
        )
        emp.set_password('Ccs@12345')
        emp.role = UserRole.DISTRIBUTOR
        emp.status = UserStatus.APPROVED
        emp.is_verified = True
        emp.km_rate = 5.0
        emp.save()
        self.stdout.write(self.style.SUCCESS('Seeded employee: employee1@ccs.com / Ccs@12345'))

        # 3. Dealer
        dealer, created = User.objects.get_or_create(
            email='dealer1@ccs.com',
            defaults={
                'username': 'dealer1',
                'role': UserRole.DEALER,
                'first_name': 'Kisan',
                'last_name': 'Agro',
                'status': UserStatus.APPROVED,
                'is_verified': True,
            }
        )
        dealer.set_password('Ccs@12345')
        dealer.role = UserRole.DEALER
        dealer.status = UserStatus.APPROVED
        dealer.is_verified = True
        dealer.save()
        DealerProfile.objects.get_or_create(
            user=dealer,
            defaults={
                'company_name': 'Kisan Agro Center',
                'city': 'Ahmedabad',
                'state': 'Gujarat'
            }
        )
        self.stdout.write(self.style.SUCCESS('Seeded dealer: dealer1@ccs.com / Ccs@12345'))

        # 4. Warehouse
        wh, created = User.objects.get_or_create(
            email='warehouse@ccs.com',
            defaults={
                'username': 'warehouse_user',
                'role': UserRole.WAREHOUSE,
                'first_name': 'Central',
                'last_name': 'Warehouse',
                'status': UserStatus.APPROVED,
                'is_verified': True,
            }
        )
        wh.set_password('Ccs@12345')
        wh.role = UserRole.WAREHOUSE
        wh.status = UserStatus.APPROVED
        wh.is_verified = True
        wh.save()
        self.stdout.write(self.style.SUCCESS('Seeded warehouse: warehouse@ccs.com / Ccs@12345'))
