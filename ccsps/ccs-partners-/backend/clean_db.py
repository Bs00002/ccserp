import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccs_backend.settings')
django.setup()

from apps.orders.models import Order, OrderItem
from apps.hr.models import DealerVisit, Attendance, Expense, LocationTrack, DailyTourPlan
from apps.crm.models import Lead, Quotation, FollowUp
from apps.products.models import Product, Category

def clean_database():
    print("Clearing all transactional and demo records...")

    print("Deleting Order items and Orders...")
    OrderItem.objects.all().delete()
    Order.objects.all().delete()

    print("Deleting HR records (Visits, Attendance, Expenses, Tour Plans, Location Tracks)...")
    DealerVisit.objects.all().delete()
    Attendance.objects.all().delete()
    Expense.objects.all().delete()
    LocationTrack.objects.all().delete()
    DailyTourPlan.objects.all().delete()

    print("Deleting CRM records (Leads, Quotations, FollowUps)...")
    FollowUp.objects.all().delete()
    Quotation.objects.all().delete()
    Lead.objects.all().delete()

    print("Deleting Demo Products...")
    Product.objects.all().delete()
    Category.objects.all().delete()

    print("Database cleanup complete! Baseline clean state established.")

if __name__ == '__main__':
    clean_database()
