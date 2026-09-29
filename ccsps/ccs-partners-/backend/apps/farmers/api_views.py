from rest_framework import viewsets, permissions
from .models import FarmerProfile, FarmerVisit
from .serializers import FarmerProfileSerializer, FarmerVisitSerializer

class FarmerProfileViewSet(viewsets.ModelViewSet):
    queryset = FarmerProfile.objects.all().order_by('-created_at')
    serializer_class = FarmerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

class FarmerVisitViewSet(viewsets.ModelViewSet):
    queryset = FarmerVisit.objects.all().order_by('-visit_date')
    serializer_class = FarmerVisitSerializer
    permission_classes = [permissions.IsAuthenticated]
