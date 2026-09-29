from rest_framework import serializers
from .models import Wallet, LedgerEntry, Payment

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class LedgerEntrySerializer(serializers.ModelSerializer):
    payment_details = PaymentSerializer(read_only=True)
    
    class Meta:
        model = LedgerEntry
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'wallet']

class WalletSerializer(serializers.ModelSerializer):
    dealer_name = serializers.CharField(source='dealer.get_full_name', read_only=True)
    dealer_email = serializers.CharField(source='dealer.email', read_only=True)
    ledger_entries = LedgerEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Wallet
        fields = ['id', 'dealer', 'dealer_name', 'dealer_email', 'credit_limit', 'outstanding_amount', 'ledger_entries', 'created_at']
        read_only_fields = ['id', 'dealer', 'outstanding_amount', 'created_at']
