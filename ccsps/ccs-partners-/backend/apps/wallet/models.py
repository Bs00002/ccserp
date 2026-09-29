from django.db import models
from django.conf import settings
from apps.common.models import BaseModel

class Wallet(BaseModel):
    dealer = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    outstanding_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Wallet for {self.dealer.email} - Outstanding: {self.outstanding_amount}"

    def update_outstanding(self):
        # Calculate from ledger
        balance = self.ledger_entries.aggregate(
            total=models.Sum(
                models.Case(
                    models.When(type='Invoice', then='amount'),
                    models.When(type='Collection', then=models.F('amount') * -1),
                    default=0,
                    output_field=models.DecimalField()
                )
            )
        )['total'] or 0
        self.outstanding_amount = balance
        self.save()

class LedgerEntryType(models.TextChoices):
    INVOICE = 'Invoice', 'Invoice'
    COLLECTION = 'Collection', 'Collection'

class LedgerEntry(BaseModel):
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='ledger_entries')
    type = models.CharField(max_length=20, choices=LedgerEntryType.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference = models.CharField(max_length=100, blank=True, null=True, help_text="Order ID or Transaction ID")
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.type} of {self.amount} for {self.wallet.dealer.email}"

class PaymentMethod(models.TextChoices):
    CASH = 'Cash', 'Cash'
    CHEQUE = 'Cheque', 'Cheque'
    NEFT = 'NEFT', 'NEFT'
    RTGS = 'RTGS', 'RTGS'
    UPI = 'UPI', 'UPI'
    CREDIT_NOTE = 'Credit Note', 'Credit Note'

class Payment(BaseModel):
    ledger_entry = models.OneToOneField(LedgerEntry, on_delete=models.CASCADE, related_name='payment_details')
    method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    payment_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, default='Completed')
    
    def __str__(self):
        return f"{self.method} - {self.transaction_id}"
