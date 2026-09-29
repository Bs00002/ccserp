from rest_framework import serializers
from .models import Warehouse, Godown, StockLedger

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'

class GodownSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    
    class Meta:
        model = Godown
        fields = '__all__'

class StockLedgerSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    godown_name = serializers.CharField(source='godown.name', read_only=True)
    
    class Meta:
        model = StockLedger
        fields = '__all__'
