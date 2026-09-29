from rest_framework import serializers
from .models import Lead, Quotation, FollowUp
from apps.accounts.serializers import UserSerializer

class FollowUpSerializer(serializers.ModelSerializer):
    handled_by_details = UserSerializer(source='handled_by', read_only=True)
    class Meta:
        model = FollowUp
        fields = '__all__'

class QuotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quotation
        fields = '__all__'

class LeadSerializer(serializers.ModelSerializer):
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    quotations = QuotationSerializer(many=True, read_only=True)
    followups = FollowUpSerializer(many=True, read_only=True)
    
    class Meta:
        model = Lead
        fields = '__all__'
