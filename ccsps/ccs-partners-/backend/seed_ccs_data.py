import os
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccs_backend.settings')
django.setup()

from apps.accounts.models import User, UserRole, UserStatus, DealerProfile, DistributorProfile
from apps.products.models import Category, SubCategory, Brand, Product
from apps.orders.models import Order, OrderItem, OrderTimeline, OrderStatus, PaymentStatus

# Real Chitra Crop Science style data
CATEGORIES = ['Insecticides', 'Fungicides', 'Herbicides', 'Plant Growth Regulators', 'Bio-Stimulants', 'Fertilizers']

PRODUCTS_DATA = [
    {"name": "Chitra Zyme", "cat": "Bio-Stimulants", "tech": "Amino Acid + Seaweed Extract", "mrp": 850, "dp": 650, "pack": "500 ml"},
    {"name": "Chitra Gold", "cat": "Plant Growth Regulators", "tech": "Humic Acid 98%", "mrp": 450, "dp": 320, "pack": "1 kg"},
    {"name": "Chitra King", "cat": "Insecticides", "tech": "Chlorpyrifos 50% + Cypermethrin 5% EC", "mrp": 1200, "dp": 950, "pack": "1 Ltr"},
    {"name": "C-Mida", "cat": "Insecticides", "tech": "Imidacloprid 17.8% SL", "mrp": 650, "dp": 480, "pack": "250 ml"},
    {"name": "Chitra Thiox", "cat": "Insecticides", "tech": "Thiamethoxam 25% WG", "mrp": 550, "dp": 400, "pack": "100 gm"},
    {"name": "C-Monco", "cat": "Fungicides", "tech": "Mancozeb 75% WP", "mrp": 350, "dp": 250, "pack": "500 gm"},
    {"name": "Chitra Hexa", "cat": "Fungicides", "tech": "Hexaconazole 5% SC", "mrp": 420, "dp": 310, "pack": "1 Ltr"},
    {"name": "Weed-X", "cat": "Herbicides", "tech": "Glyphosate 41% SL", "mrp": 750, "dp": 550, "pack": "1 Ltr"},
    {"name": "C-Pendim", "cat": "Herbicides", "tech": "Pendimethalin 30% EC", "mrp": 600, "dp": 450, "pack": "1 Ltr"},
    {"name": "Chitra NPK", "cat": "Fertilizers", "tech": "Water Soluble NPK 19:19:19", "mrp": 250, "dp": 180, "pack": "1 kg"},
    {"name": "Chitra Shakti", "cat": "Bio-Stimulants", "tech": "Nitrobenzene 20% v/w", "mrp": 380, "dp": 280, "pack": "500 ml"},
    {"name": "Root-X", "cat": "Plant Growth Regulators", "tech": "Mycorrhiza", "mrp": 500, "dp": 380, "pack": "4 kg Granules"},
    {"name": "Chitra Phos", "cat": "Insecticides", "tech": "Profenofos 50% EC", "mrp": 850, "dp": 680, "pack": "1 Ltr"},
    {"name": "C-Sulf", "cat": "Fungicides", "tech": "Sulphur 80% WDG", "mrp": 150, "dp": 100, "pack": "500 gm"},
    {"name": "Buraan", "cat": "Fertilizers", "tech": "Boron 20%", "mrp": 200, "dp": 140, "pack": "250 gm"},
]

CITIES = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Navsari', 'Morbi', 'Mehsana']

def seed_data():
    print("Clearing old data...")
    Order.objects.all().delete()
    Product.objects.all().delete()
    Category.objects.all().delete()
    Brand.objects.all().delete()
    # Delete test users except admin (Assuming admin is id=1 or superuser)
    User.objects.filter(is_superuser=False).delete()

    brand, _ = Brand.objects.get_or_create(name="Chitra Crop Science")

    print("Creating Categories...")
    cat_objs = {}
    for c in CATEGORIES:
        cat_objs[c], _ = Category.objects.get_or_create(name=c)

    print("Creating Products...")
    products_created = []
    for p in PRODUCTS_DATA:
        prod = Product.objects.create(
            name=p['name'],
            brand=brand,
            category=cat_objs[p['cat']],
            technical_name=p['tech'],
            mrp=p['mrp'],
            dealer_price=p['dp'],
            packing=p['pack'],
            stock=random.randint(50, 1000),
            status='Active'
        )
        products_created.append(prod)

    print("Creating Distributors (Employees)...")
    distributors = []
    for i in range(1, 6):
        user = User.objects.create(
            email=f"employee{i}@ccs.com",
            username=f"employee{i}",
            role=UserRole.DISTRIBUTOR,
            status=UserStatus.APPROVED,
            is_verified=True,
            first_name=f"Ramesh {i}",
            last_name="Singh"
        )
        user.set_password("Ccs@12345")
        user.save()
        DistributorProfile.objects.create(user=user, company_name=f"Chitra Depot {CITIES[i%len(CITIES)]}")
        distributors.append(user)

    print("Creating Dealers...")
    dealers = []
    for i in range(1, 51):
        city = random.choice(CITIES)
        user = User.objects.create(
            email=f"dealer{i}@ccs.com",
            username=f"dealer{i}",
            role=UserRole.DEALER,
            status=UserStatus.APPROVED,
            is_verified=True,
            first_name=f"Dealer {i}",
            last_name="Patel"
        )
        user.set_password("Ccs@12345")
        user.save()
        DealerProfile.objects.create(
            user=user, 
            company_name=f"Kisan Agro {city} {i}",
            city=city,
            state="Gujarat"
        )
        dealers.append(user)

    print("Creating Orders...")
    for i in range(30):
        dealer = random.choice(dealers)
        creator = random.choice(distributors)
        
        status = random.choice([OrderStatus.PENDING_APPROVAL, OrderStatus.APPROVED, OrderStatus.DISPATCHED, OrderStatus.DELIVERED] if hasattr(OrderStatus, 'DISPATCHED') else [OrderStatus.PENDING_APPROVAL, OrderStatus.APPROVED, OrderStatus.DELIVERED])
        
        order = Order.objects.create(
            dealer=dealer,
            created_by=creator,
            status=status,
            payment_status=PaymentStatus.PENDING if status != OrderStatus.DELIVERED else random.choice([PaymentStatus.PENDING, PaymentStatus.PAID]),
            remarks=f"Order by {creator.username}"
        )
        
        # Add 1 to 4 items
        subtotal = 0
        for _ in range(random.randint(1, 4)):
            prod = random.choice(products_created)
            qty = random.randint(1, 50)
            rate = prod.dealer_price
            total = rate * qty
            subtotal += total
            
            OrderItem.objects.create(
                order=order,
                product=prod,
                quantity=qty,
                rate=rate,
                total=total
            )
        
        order.subtotal = subtotal
        order.grand_total = subtotal + (subtotal * 18 / 100) # + 18% GST approx
        order.save()
        
        # Timeline
        OrderTimeline.objects.create(order=order, status=OrderStatus.DRAFT, created_by=creator)
        OrderTimeline.objects.create(order=order, status=OrderStatus.SUBMITTED, created_by=creator)
        if status in [OrderStatus.APPROVED, OrderStatus.DELIVERED]:
             OrderTimeline.objects.create(order=order, status=OrderStatus.APPROVED, created_by=User.objects.filter(is_superuser=True).first() or creator)

    from django.core.management import call_command
    print("Creating Demo Users...")
    call_command("create_demo_users")

    print("Seeding Complete!")

if __name__ == "__main__":
    seed_data()
