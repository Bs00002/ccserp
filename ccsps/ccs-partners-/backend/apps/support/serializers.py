from rest_framework import serializers
from .models import Complaint, ReturnRequest, Enquiry

class ComplaintSerializer(serializers.ModelSerializer):
    dealer_name = serializers.CharField(source='dealer.username', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    
    class Meta:
        model = Complaint
        fields = '__all__'
        read_only_fields = ['status', 'assigned_to']

class AdminComplaintSerializer(ComplaintSerializer):
    class Meta:
        model = Complaint
        fields = '__all__'

class ReturnRequestSerializer(serializers.ModelSerializer):
    dealer_name = serializers.CharField(source='dealer.username', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    
    class Meta:
        model = ReturnRequest
        fields = '__all__'
        read_only_fields = ['status', 'assigned_to']

class AdminReturnRequestSerializer(ReturnRequestSerializer):
    class Meta:
        model = ReturnRequest
        fields = '__all__'

class EnquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Enquiry
        fields = '__all__'
