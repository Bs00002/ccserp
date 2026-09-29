from django.core.management.base import BaseCommand
from apps.products.models import Category, Brand, Product

class Command(BaseCommand):
    help = 'Seeds the database with Chitra Crop Science product catalogue'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding Chitra Crop Science products...')

        # Ensure CCS Brand exists
        brand, _ = Brand.objects.get_or_create(
            name='Chitra Crop Science',
            defaults={'description': 'Premium Agricultural Inputs'}
        )

        # Categories
        cat_fert, _ = Category.objects.get_or_create(name='Water-Soluble Fertilizers')
        cat_ins, _ = Category.objects.get_or_create(name='Insecticides & Protection')
        cat_bio, _ = Category.objects.get_or_create(name='Bio-Stimulants & Growth')
        cat_fung, _ = Category.objects.get_or_create(name='Fungicides & Herbicides')

        products_data = [
            # Water-Soluble Fertilizers
            {
                'name': 'Chitra MEG Magnesium Sulphate', 'category': cat_fert, 
                'technical_name': 'Magnesium Sulphate 9.6% Mg', 'composition': 'Mg: 9.6%, S: 12.0%',
                'benefits': 'Essential for chlorophyll production, prevents yellowing of leaves, ensures better photosynthesis.',
                'dosage': '5-10 kg per acre', 'crop': 'All Crops', 'packing': '25kg, 50kg',
                'image_url': 'https://images.unsplash.com/photo-1592982537447-6f23f81eb5d5?w=500'
            },
            {
                'name': 'Chitra NPK', 'category': cat_fert, 
                'technical_name': 'NPK 19:19:19', 'composition': 'Nitrogen 19%, Phosphorus 19%, Potassium 19%',
                'benefits': 'Balanced nutrient supply for vegetative growth.',
                'dosage': '5 kg per acre', 'crop': 'All Crops', 'packing': '1kg, 25kg',
                'image_url': 'https://images.unsplash.com/photo-1627920769840-69237691656b?w=500'
            },
            {
                'name': 'Chitra MAP', 'category': cat_fert, 
                'technical_name': 'Monoammonium Phosphate 12:61:0', 'composition': 'Nitrogen 12%, Phosphorus 61%',
                'benefits': 'Promotes rapid root growth and early crop establishment.',
                'dosage': '3-5 kg per acre', 'crop': 'Fruits, Vegetables, Cash Crops', 'packing': '25kg',
                'image_url': 'https://images.unsplash.com/photo-1530836369250-ef71a3f5e43c?w=500'
            },
            {
                'name': 'Chitra SOP', 'category': cat_fert, 
                'technical_name': 'Sulphate of Potash 0:0:50', 'composition': 'Potassium 50%, Sulphur 17.5%',
                'benefits': 'Improves fruit quality, color, and shelf life.',
                'dosage': '5 kg per acre', 'crop': 'Fruits, Vegetables', 'packing': '25kg',
                'image_url': 'https://images.unsplash.com/photo-1586771107445-d3afcb8da0ce?w=500'
            },

            # Insecticides
            {
                'name': 'Agneepath GR', 'category': cat_ins, 
                'technical_name': 'Cartap Hydrochloride 4% GR', 'composition': 'Cartap Hydrochloride 4% w/w',
                'benefits': 'Highly effective against stem borer and leaf folder.',
                'dosage': '7.5 - 10 kg per acre', 'crop': 'Paddy, Sugarcane', 'packing': '1kg, 5kg',
                'image_url': 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=500'
            },
            {
                'name': 'C Imida', 'category': cat_ins, 
                'technical_name': 'Imidacloprid 17.8% SL', 'composition': 'Imidacloprid 17.8% SL',
                'benefits': 'Systemic insecticide for controlling sucking pests.',
                'dosage': '100-150 ml per acre', 'crop': 'Cotton, Chilli, Tomato', 'packing': '100ml, 250ml, 500ml, 1L',
                'image_url': 'https://images.unsplash.com/photo-1530836369250-ef71a3f5e43c?w=500'
            },
            {
                'name': 'Attack 505', 'category': cat_ins, 
                'technical_name': 'Chlorpyrifos 50% + Cypermethrin 5% EC', 'composition': 'Chlorpyrifos 50% + Cypermethrin 5% EC',
                'benefits': 'Broad spectrum insecticide with strong contact and stomach action.',
                'dosage': '400 ml per acre', 'crop': 'Cotton, Paddy, Vegetables', 'packing': '500ml, 1L',
                'image_url': 'https://images.unsplash.com/photo-1586771107445-d3afcb8da0ce?w=500'
            },

            # Bio-Stimulants & Growth
            {
                'name': 'Active 100 Super Spreader', 'category': cat_bio, 
                'technical_name': 'Silicone Based Spreader', 'composition': 'Polyether modified trisiloxane',
                'benefits': 'Increases efficacy of pesticides by better spreading and penetration.',
                'dosage': '5 ml per 15L water', 'crop': 'All Crops', 'packing': '50ml, 100ml, 250ml',
                'image_url': 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500'
            },
            {
                'name': 'CCS-303', 'category': cat_bio, 
                'technical_name': 'Plant Growth Promoter', 'composition': 'Amino Acids + Vitamins',
                'benefits': 'Enhances crop vigor and yield potential.',
                'dosage': '250 ml per acre', 'crop': 'Vegetables, Fruits', 'packing': '250ml, 500ml, 1L',
                'image_url': 'https://images.unsplash.com/photo-1592982537447-6f23f81eb5d5?w=500'
            },

            # Fungicides & Herbicides
            {
                'name': 'Chitra-COC', 'category': cat_fung, 
                'technical_name': 'Copper Oxychloride 50% WP', 'composition': 'Copper Oxychloride 50% WP',
                'benefits': 'Broad spectrum fungicide controlling major leaf spots and blights.',
                'dosage': '500g per acre', 'crop': 'Grapes, Potato, Tomato', 'packing': '500g',
                'image_url': 'https://images.unsplash.com/photo-1627920769840-69237691656b?w=500'
            },
            {
                'name': 'Kill 71 Glyphosate', 'category': cat_fung, 
                'technical_name': 'Glyphosate 71% SG', 'composition': 'Glyphosate 71% SG',
                'benefits': 'Non-selective systemic herbicide for effective weed control.',
                'dosage': '100g per 15L water', 'crop': 'Non-cropped areas, Tea', 'packing': '100g, 1kg',
                'image_url': 'https://images.unsplash.com/photo-1530836369250-ef71a3f5e43c?w=500'
            }
        ]

        Product.objects.all().delete()
        for p in products_data:
            Product.objects.create(brand=brand, **p)

        self.stdout.write(self.style.SUCCESS('Successfully seeded products!'))
