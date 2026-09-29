from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.models import UserRole
from .models import Wallet, LedgerEntry, LedgerEntryType
from .serializers import WalletSerializer, LedgerEntrySerializer

class WalletViewSet(viewsets.ModelViewSet):
    serializer_class = WalletSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.EMPLOYEE]:
            return Wallet.objects.all()
        return Wallet.objects.filter(dealer=user)

    @action(detail=True, methods=['post'])
    def add_collection(self, request, pk=None):
        user = request.user
        if user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DISTRIBUTOR, UserRole.EMPLOYEE]:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        wallet = self.get_object()
        amount = request.data.get('amount')
        reference = request.data.get('reference', '')
        notes = request.data.get('notes', '')

        if not amount:
            return Response({"error": "Amount is required"}, status=status.HTTP_400_BAD_REQUEST)

        entry = LedgerEntry.objects.create(
            wallet=wallet,
            type=LedgerEntryType.COLLECTION,
            amount=amount,
            reference=reference,
            notes=notes,
            created_by=user
        )
        
        # Create Payment Details
        payment_method = request.data.get('payment_method', 'Cash')
        transaction_id = request.data.get('transaction_id', reference)
        
        from .models import Payment
        Payment.objects.create(
            ledger_entry=entry,
            method=payment_method,
            transaction_id=transaction_id
        )
        
        wallet.update_outstanding()
        
        return Response(WalletSerializer(wallet).data)

    @action(detail=False, methods=['get'])
    def my_wallet(self, request):
        user = request.user
        if user.role != UserRole.DEALER:
            return Response({"error": "Only dealers have a personal wallet context here."}, status=status.HTTP_400_BAD_REQUEST)
        
        wallet, created = Wallet.objects.get_or_create(dealer=user)
        return Response(WalletSerializer(wallet).data)

class LedgerEntryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LedgerEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
            return LedgerEntry.objects.all().order_by('-created_at')
        elif user.role in [UserRole.DISTRIBUTOR, UserRole.EMPLOYEE]:
            return LedgerEntry.objects.filter(created_by=user).order_by('-created_at')
        elif user.role == UserRole.DEALER:
            return LedgerEntry.objects.filter(wallet__dealer=user).order_by('-created_at')
        return LedgerEntry.objects.none()
