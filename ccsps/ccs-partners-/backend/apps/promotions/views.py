from rest_framework import viewsets, permissions
from .models import Scheme, LoyaltyPoint
from .serializers import SchemeSerializer, LoyaltyPointSerializer
from apps.accounts.models import UserRole

class SchemeViewSet(viewsets.ModelViewSet):
    queryset = Scheme.objects.all().order_by('-created_at')
    serializer_class = SchemeSerializer
    permission_classes = [permissions.IsAuthenticated]

class LoyaltyPointViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LoyaltyPointSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT]:
            return LoyaltyPoint.objects.all().order_by('-created_at')
        return LoyaltyPoint.objects.filter(dealer=user).order_by('-created_at')
