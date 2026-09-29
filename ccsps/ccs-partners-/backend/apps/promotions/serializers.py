from rest_framework import serializers
from .models import Scheme, LoyaltyPoint

class SchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scheme
        fields = '__all__'

class LoyaltyPointSerializer(serializers.ModelSerializer):
    dealer_name = serializers.CharField(source='dealer.username', read_only=True)
    
    class Meta:
        model = LoyaltyPoint
        fields = '__all__'
