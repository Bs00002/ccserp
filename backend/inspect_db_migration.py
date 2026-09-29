import os
import sys
import django
from decimal import Decimal

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccs_backend.settings')
django.setup()

from django.conf import settings
from django.db import connection, migrations
from django.db.migrations.recorder import MigrationRecorder

from apps.accounts.models import User, UserRole, EmployeeProfile, DistributorProfile, DealerProfile
from apps.products.models import Product, Category
from apps.orders.models import Order, OrderItem, Invoice, OrderTimeline
from apps.wallet.models import Wallet, LedgerEntry, Payment
from apps.inventory.models import Warehouse, StockLedger
from apps.hr.models import Attendance, DealerVisit, Expense, LocationTrack, DailyTourPlan
from apps.support.models import Complaint, ReturnRequest, Enquiry
from apps.notifications.models import Notification
from apps.common.models import AuditLog

def audit_database():
    db_config = settings.DATABASES['default']
    engine = db_config.get('ENGINE')
    db_name = str(db_config.get('NAME'))
    
    print("=" * 60)
    print("CCS CONNECT: DATABASE AUDIT & MIGRATION READINESS")
    print("=" * 60)
    print(f"Current DB Engine  : {engine}")
    print(f"Current DB Name    : {db_name}")
    
    if os.path.exists(db_name):
        size = os.path.getsize(db_name)
        print(f"Database File Size : {size:,} bytes ({size / (1024*1024):.2f} MB)")
    else:
        print("Database File      : External or not a file")
        
    # Table counts
    tables = connection.introspection.table_names()
    print(f"Total Table Count  : {len(tables)}")
    
    # Applied migrations
    recorder = MigrationRecorder(connection)
    applied_migrations = recorder.applied_migrations()
    print(f"Applied Migrations : {len(applied_migrations)}")
    
    print("\n--- MODEL RECORD COUNTS ---")
    models_to_check = [
        ("Users (Total)", User.objects.count()),
        ("  - Super Admin / Admin", User.objects.filter(role__in=[UserRole.SUPER_ADMIN, UserRole.ADMIN]).count()),
        ("  - Distributors / Field", User.objects.filter(role=UserRole.DISTRIBUTOR).count()),
        ("  - Dealers", User.objects.filter(role=UserRole.DEALER).count()),
        ("  - Warehouse Staff", User.objects.filter(role=UserRole.WAREHOUSE).count()),
        ("Employee Profiles", EmployeeProfile.objects.count()),
        ("Distributor Profiles", DistributorProfile.objects.count()),
        ("Dealer Profiles", DealerProfile.objects.count()),
        ("Categories", Category.objects.count()),
        ("Products", Product.objects.count()),
        ("Orders", Order.objects.count()),
        ("Order Items", OrderItem.objects.count()),
        ("Order Timelines", OrderTimeline.objects.count()),
        ("Invoices", Invoice.objects.count()),
        ("Wallets", Wallet.objects.count()),
        ("Wallet Ledger Entries", LedgerEntry.objects.count()),
        ("Payments", Payment.objects.count()),
        ("Warehouses", Warehouse.objects.count()),
        ("Stock Ledger Entries", StockLedger.objects.count()),
        ("Attendance Records", Attendance.objects.count()),
        ("Dealer Visits", DealerVisit.objects.count()),
        ("Daily Tour Plans", DailyTourPlan.objects.count()),
        ("Expenses", Expense.objects.count()),
        ("Location Tracks", LocationTrack.objects.count()),
        ("Sales Target Profiles", DistributorProfile.objects.exclude(monthly_sales_plan=0).count()),
        ("Complaints", Complaint.objects.count()),
        ("Return Requests", ReturnRequest.objects.count()),
        ("Enquiries", Enquiry.objects.count()),
        ("Notifications", Notification.objects.count()),
        ("Audit Logs", AuditLog.objects.count()),
    ]
    
    for label, count in models_to_check:
        print(f"  {label:<30}: {count}")

    print("\n--- ALL RAW SQLITE TABLES & ROW COUNTS ---")
    cursor = connection.cursor()
    for t in sorted(tables):
        cursor.execute(f'SELECT COUNT(*) FROM "{t}"')
        cnt = cursor.fetchone()[0]
        print(f"  {t:<40}: {cnt}")

if __name__ == '__main__':
    audit_database()
