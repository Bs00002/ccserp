from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Complaint, ReturnRequest, Enquiry, ComplaintStatus, ReturnStatus
from .serializers import (
    ComplaintSerializer, AdminComplaintSerializer, 
    ReturnRequestSerializer, AdminReturnRequestSerializer, 
    EnquirySerializer
)
from apps.accounts.models import UserRole
from apps.common.events import broadcast_erp_event

class ComplaintViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return Complaint.objects.select_related('dealer', 'assigned_to').all().order_by('-created_at')
        return Complaint.objects.select_related('dealer', 'assigned_to').filter(dealer=user).order_by('-created_at')
        
    def get_serializer_class(self):
        user = self.request.user
        if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return AdminComplaintSerializer
        return ComplaintSerializer
        
    def perform_create(self, serializer):
        complaint = serializer.save(dealer=self.request.user)
        broadcast_erp_event(
            event_type='support.updated',
            payload={
                "id": str(complaint.id),
                "type": "Complaint",
                "category": complaint.category,
                "status": complaint.status,
                "dealer_id": str(complaint.dealer_id) if complaint.dealer_id else None
            },
            target_roles=['Admin'],
            target_user_ids=[str(complaint.dealer_id)] if complaint.dealer_id else []
        )

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        user = request.user
        if user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return Response({"error": "Unauthorized. Only Admin can update complaint status."}, status=status.HTTP_403_FORBIDDEN)

        complaint = self.get_object()
        new_status = request.data.get('status')
        resolution = request.data.get('resolution_timeline', '')
        assigned_to_id = request.data.get('assigned_to')

        if new_status:
            valid_statuses = [choice[0] for choice in ComplaintStatus.choices]
            if new_status not in valid_statuses:
                return Response({"error": f"Invalid status. Must be one of: {valid_statuses}"}, status=status.HTTP_400_BAD_REQUEST)
            complaint.status = new_status

        if resolution:
            complaint.resolution_timeline = resolution

        if assigned_to_id:
            complaint.assigned_to_id = assigned_to_id

        complaint.save()
        data = AdminComplaintSerializer(complaint).data
        broadcast_erp_event(
            event_type='support.updated',
            payload=data,
            target_roles=['Admin'],
            target_user_ids=[str(complaint.dealer_id)]
        )
        return Response(data)

class ReturnRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return ReturnRequest.objects.select_related('dealer', 'order', 'assigned_to').all().order_by('-created_at')
        return ReturnRequest.objects.select_related('dealer', 'order', 'assigned_to').filter(dealer=user).order_by('-created_at')
        
    def get_serializer_class(self):
        user = self.request.user
        if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return AdminReturnRequestSerializer
        return ReturnRequestSerializer
        
    def perform_create(self, serializer):
        ret = serializer.save(dealer=self.request.user)
        broadcast_erp_event(
            event_type='support.updated',
            payload={
                "id": str(ret.id),
                "type": "ReturnRequest",
                "reason": ret.reason,
                "status": ret.status,
                "dealer_id": str(ret.dealer_id) if ret.dealer_id else None
            },
            target_roles=['Admin'],
            target_user_ids=[str(ret.dealer_id)] if ret.dealer_id else []
        )

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        user = request.user
        if user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return Response({"error": "Unauthorized. Only Admin can update return status."}, status=status.HTTP_403_FORBIDDEN)

        return_obj = self.get_object()
        new_status = request.data.get('status')
        assigned_to_id = request.data.get('assigned_to')

        if new_status:
            valid_statuses = [choice[0] for choice in ReturnStatus.choices]
            if new_status not in valid_statuses:
                return Response({"error": f"Invalid status. Must be one of: {valid_statuses}"}, status=status.HTTP_400_BAD_REQUEST)
            return_obj.status = new_status

        if assigned_to_id:
            return_obj.assigned_to_id = assigned_to_id

        return_obj.save()
        data = AdminReturnRequestSerializer(return_obj).data
        broadcast_erp_event(
            event_type='support.updated',
            payload=data,
            target_roles=['Admin'],
            target_user_ids=[str(return_obj.dealer_id)] if return_obj.dealer_id else []
        )
        return Response(data)

class EnquiryViewSet(viewsets.ModelViewSet):
    queryset = Enquiry.objects.all().order_by('-created_at')
    serializer_class = EnquirySerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return Enquiry.objects.all().order_by('-created_at')
        return Enquiry.objects.none()

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        if request.user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return Response({"error": "Unauthorized. Only Admin can resolve enquiries."}, status=status.HTTP_403_FORBIDDEN)
        enquiry = self.get_object()
        enquiry.is_resolved = True
        enquiry.save()
        return Response(EnquirySerializer(enquiry).data)

