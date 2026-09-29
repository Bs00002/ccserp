from rest_framework import serializers
from .models import FarmerProfile, FarmerVisit
from apps.accounts.serializers import UserSerializer

class FarmerVisitSerializer(serializers.ModelSerializer):
    visited_by_details = UserSerializer(source='visited_by', read_only=True)
    class Meta:
        model = FarmerVisit
        fields = '__all__'

class FarmerProfileSerializer(serializers.ModelSerializer):
    visits = FarmerVisitSerializer(many=True, read_only=True)
    associated_dealer_details = UserSerializer(source='associated_dealer', read_only=True)
    
    class Meta:
        model = FarmerProfile
        fields = '__all__'
