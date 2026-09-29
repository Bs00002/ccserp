from rest_framework import serializers
from .models import Wallet, LedgerEntry, Payment

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class LedgerEntrySerializer(serializers.ModelSerializer):
    payment_details = PaymentSerializer(read_only=True)
    dealer_id = serializers.UUIDField(source='wallet.dealer.id', read_only=True)
    dealer_name = serializers.SerializerMethodField()
    dealer_email = serializers.CharField(source='wallet.dealer.email', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    payment_method = serializers.SerializerMethodField()
    transaction_id = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    
    class Meta:
        model = LedgerEntry
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'wallet', 'created_by']

    def get_dealer_name(self, obj):
        dealer = getattr(obj.wallet, 'dealer', None)
        if not dealer:
            return 'N/A'
        full = dealer.get_full_name().strip()
        if full:
            return full
        profile = getattr(dealer, 'dealer_profile', None)
        if profile and getattr(profile, 'company_name', None):
            return profile.company_name
        return dealer.username or dealer.email

    def get_created_by_name(self, obj):
        creator = obj.created_by
        if not creator:
            return 'System'
        return creator.get_full_name().strip() or creator.username or creator.email

    def get_payment_method(self, obj):
        payment = getattr(obj, 'payment_details', None)
        return payment.method if payment else 'Cash'

    def get_transaction_id(self, obj):
        payment = getattr(obj, 'payment_details', None)
        return payment.transaction_id if payment else (obj.reference or '')

    def get_payment_status(self, obj):
        payment = getattr(obj, 'payment_details', None)
        return payment.status if payment else 'Completed'

class WalletSerializer(serializers.ModelSerializer):
    dealer_name = serializers.SerializerMethodField()
    dealer_email = serializers.CharField(source='dealer.email', read_only=True)
    ledger_entries = LedgerEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Wallet
        fields = ['id', 'dealer', 'dealer_name', 'dealer_email', 'credit_limit', 'outstanding_amount', 'ledger_entries', 'created_at']
        read_only_fields = ['id', 'dealer', 'outstanding_amount', 'created_at']

    def get_dealer_name(self, obj):
        if not obj.dealer:
            return 'N/A'
        full = obj.dealer.get_full_name().strip()
        if full:
            return full
        profile = getattr(obj.dealer, 'dealer_profile', None)
        if profile and getattr(profile, 'company_name', None):
            return profile.company_name
        return obj.dealer.username or obj.dealer.email
