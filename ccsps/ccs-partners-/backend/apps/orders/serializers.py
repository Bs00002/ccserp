from rest_framework import serializers
from .models import Order, OrderItem, OrderTimeline, Invoice
from apps.products.serializers import ProductSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = '__all__'
        read_only_fields = ('order',)

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    dealer_name = serializers.CharField(source='dealer.username', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    bilty_uploaded_by_name = serializers.CharField(source='bilty_uploaded_by.username', read_only=True)
    lr_generated_by_name = serializers.CharField(source='lr_generated_by.username', read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('order_number', 'status', 'payment_status', 'subtotal', 'discount', 'gst_total', 'grand_total', 'created_by')

    def create(self, validated_data):
        return super().create(validated_data)

class OrderTimelineSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = OrderTimeline
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'
