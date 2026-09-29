from decimal import Decimal, InvalidOperation
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.models import User, UserRole
from .models import Wallet, LedgerEntry, LedgerEntryType, Payment, PaymentMethod
from .serializers import WalletSerializer, LedgerEntrySerializer
from apps.common.events import broadcast_erp_event

class WalletViewSet(viewsets.ModelViewSet):
    serializer_class = WalletSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DISTRIBUTOR]:
            return Wallet.objects.select_related('dealer').all()
        elif user.role == UserRole.DEALER:
            return Wallet.objects.select_related('dealer').filter(dealer=user)
        return Wallet.objects.none()

    @action(detail=True, methods=['post'])
    def add_collection(self, request, pk=None):
        user = request.user
        if user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DISTRIBUTOR]:
            return Response({"error": "Unauthorized. Only Admin and Field staff can record collections."}, status=status.HTTP_403_FORBIDDEN)
            
        wallet = self.get_object()
        amount = request.data.get('amount')
        reference = request.data.get('reference', '').strip()
        notes = request.data.get('notes', '').strip()
        payment_method = request.data.get('payment_method', request.data.get('mode', 'Cash'))

        if not amount:
            return Response({"error": "Amount is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amt = Decimal(str(amount))
            if amt <= Decimal('0'):
                return Response({"error": "Amount must be a positive number greater than zero."}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError, InvalidOperation):
            return Response({"error": "Invalid amount provided."}, status=status.HTTP_400_BAD_REQUEST)

        if reference and LedgerEntry.objects.filter(wallet=wallet, reference=reference).exists():
            return Response({"error": f"Duplicate transaction: Reference '{reference}' already exists for this dealer."}, status=status.HTTP_400_BAD_REQUEST)

        entry = LedgerEntry.objects.create(
            wallet=wallet,
            type=LedgerEntryType.COLLECTION,
            amount=amt,
            reference=reference,
            notes=notes,
            created_by=user
        )
        
        transaction_id = request.data.get('transaction_id', reference or f"TXN-{entry.id.hex[:8].upper()}")
        Payment.objects.create(
            ledger_entry=entry,
            method=payment_method,
            transaction_id=transaction_id,
            status='Completed'
        )
        
        wallet.update_outstanding()
        serialized_entry = LedgerEntrySerializer(entry).data
        broadcast_erp_event(
            event_type='payment.created',
            payload=serialized_entry,
            target_roles=['Admin'],
            target_user_ids=[str(wallet.dealer_id), str(user.id)]
        )
        return Response(serialized_entry, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def collect(self, request):
        user = request.user
        if user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DISTRIBUTOR]:
            return Response({"error": "Unauthorized. Only Admin and Field staff can record collections."}, status=status.HTTP_403_FORBIDDEN)
            
        dealer_id = request.data.get('dealer') or request.data.get('dealer_id')
        if not dealer_id:
            return Response({"error": "Dealer ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            dealer = User.objects.get(id=dealer_id, role=UserRole.DEALER)
        except (User.DoesNotExist, ValueError):
            return Response({"error": "Dealer not found or invalid dealer specified."}, status=status.HTTP_400_BAD_REQUEST)

        wallet, _ = Wallet.objects.get_or_create(dealer=dealer)
        request.parser_context = request.parser_context or {}
        return self.add_collection(request, pk=wallet.id)

    @action(detail=False, methods=['get'])
    def my_wallet(self, request):
        user = request.user
        if user.role != UserRole.DEALER:
            return Response({"error": "Only dealers have a personal wallet context."}, status=status.HTTP_400_BAD_REQUEST)
        
        wallet, _ = Wallet.objects.get_or_create(dealer=user)
        return Response(WalletSerializer(wallet).data)

class LedgerEntryViewSet(viewsets.ModelViewSet):
    serializer_class = LedgerEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = LedgerEntry.objects.select_related('wallet__dealer', 'created_by').order_by('-created_at')
        if user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
            return qs
        elif user.role == UserRole.DISTRIBUTOR:
            return qs.filter(created_by=user)
        elif user.role == UserRole.DEALER:
            return qs.filter(wallet__dealer=user)
        return LedgerEntry.objects.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DISTRIBUTOR]:
            return Response({"error": "Unauthorized. Only Admin and Field staff can submit collections."}, status=status.HTTP_403_FORBIDDEN)

        dealer_id = request.data.get('dealer') or request.data.get('dealer_id')
        amount = request.data.get('amount')
        reference = request.data.get('reference', '').strip()
        notes = request.data.get('notes', '').strip()
        payment_method = request.data.get('payment_method', request.data.get('mode', 'Cash'))

        if not dealer_id:
            return Response({"error": "Dealer is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            dealer = User.objects.get(id=dealer_id, role=UserRole.DEALER)
        except (User.DoesNotExist, ValueError):
            return Response({"error": "Dealer not found or invalid."}, status=status.HTTP_400_BAD_REQUEST)

        if not amount:
            return Response({"error": "Amount is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amt = Decimal(str(amount))
            if amt <= Decimal('0'):
                return Response({"error": "Amount must be a positive number greater than zero."}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError, InvalidOperation):
            return Response({"error": "Invalid amount provided."}, status=status.HTTP_400_BAD_REQUEST)

        wallet, _ = Wallet.objects.get_or_create(dealer=dealer)

        if reference and LedgerEntry.objects.filter(wallet=wallet, reference=reference).exists():
            return Response({"error": f"Duplicate transaction: Reference '{reference}' already exists for this dealer."}, status=status.HTTP_400_BAD_REQUEST)

        entry = LedgerEntry.objects.create(
            wallet=wallet,
            type=LedgerEntryType.COLLECTION,
            amount=amt,
            reference=reference,
            notes=notes,
            created_by=user
        )

        transaction_id = request.data.get('transaction_id', reference or f"TXN-{entry.id.hex[:8].upper()}")
        Payment.objects.create(
            ledger_entry=entry,
            method=payment_method,
            transaction_id=transaction_id,
            status='Completed'
        )

        wallet.update_outstanding()
        serializer = self.get_serializer(entry)
        broadcast_erp_event(
            event_type='payment.created',
            payload=serializer.data,
            target_roles=['Admin'],
            target_user_ids=[str(wallet.dealer_id), str(user.id)]
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
