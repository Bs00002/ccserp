from rest_framework import viewsets, permissions
from .models import Complaint, ReturnRequest
from .serializers import ComplaintSerializer, AdminComplaintSerializer, ReturnRequestSerializer, AdminReturnRequestSerializer
from apps.accounts.models import UserRole

class ComplaintViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT]:
            return Complaint.objects.all().order_by('-created_at')
        return Complaint.objects.filter(dealer=user).order_by('-created_at')
        
    def get_serializer_class(self):
        user = self.request.user
        if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT]:
            return AdminComplaintSerializer
        return ComplaintSerializer
        
    def perform_create(self, serializer):
        serializer.save(dealer=self.request.user)

class ReturnRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT]:
            return ReturnRequest.objects.all().order_by('-created_at')
        return ReturnRequest.objects.filter(dealer=user).order_by('-created_at')
        
    def get_serializer_class(self):
        user = self.request.user
        if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT]:
            return AdminReturnRequestSerializer
        return ReturnRequestSerializer
        
    def perform_create(self, serializer):
        serializer.save(dealer=self.request.user)

class EnquiryViewSet(viewsets.ModelViewSet):
    from .models import Enquiry
    from .serializers import EnquirySerializer
    queryset = Enquiry.objects.all().order_by('-created_at')
    serializer_class = EnquirySerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
