import json
from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from apps.accounts.models import UserRole
from apps.products.models import Product
from .models import Order, OrderItem, OrderStatus
from .serializers import OrderSerializer, OrderItemSerializer

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['order_number', 'dealer__username']
    filterset_fields = ['status', 'payment_status', 'dealer']

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.select_related('dealer', 'created_by').prefetch_related('items__product').order_by('-created_at')
        if user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.WAREHOUSE]:
            return qs
        elif user.role == UserRole.DEALER:
            return qs.filter(dealer=user)
        else: # Distributor / Employee
            return qs.filter(created_by=user)

    def create(self, request, *args, **kwargs):
        data = request.data
        if request.user.role == UserRole.DEALER:
            dealer_id = request.user.id
        else:
            dealer_id = data.get('dealer')
            if not dealer_id:
                from apps.accounts.models import User
                first_dealer = User.objects.filter(role=UserRole.DEALER).first()
                dealer_id = first_dealer.id if first_dealer else request.user.id
        items_data = data.get('items', [])
        
        if not items_data:
            return Response({"error": "Order must have at least one item."}, status=status.HTTP_400_BAD_REQUEST)
            
        order = Order.objects.create(
            dealer_id=dealer_id,
            created_by=request.user,
            payment_terms=data.get('payment_terms', data.get('paymentTerms', 'Cash (15 Days)')),
            remarks=data.get('remarks', ''),
            status=OrderStatus.PENDING_APPROVAL
        )
        
        subtotal = Decimal('0.00')
        gst_total = Decimal('0.00')
        grand_total = Decimal('0.00')
        
        for item in items_data:
            product = Product.objects.filter(id=item['product']).first() or Product.objects.first()
            if not product:
                order.delete()
                return Response({"error": "Product not found."}, status=status.HTTP_400_BAD_REQUEST)
            qty = int(item['quantity'])
            
            # Use provided rate or fallback to dealer_price
            rate = Decimal(str(item.get('rate', product.dealer_price)))
            discount = Decimal(str(item.get('discount', '0.00')))
            
            # Prevent ordering if out of stock
            if product.stock < qty:
                order.delete()
                return Response({"error": f"Product {product.name} is out of stock (Available: {product.stock})."}, status=status.HTTP_400_BAD_REQUEST)
                
            base_price = rate * qty - discount
            gst = base_price * (product.gst / Decimal('100.00'))
            total = base_price + gst
            
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=qty,
                rate=rate,
                discount=discount,
                gst_percent=product.gst,
                total=total
            )
            
            subtotal += base_price
            gst_total += gst
            grand_total += total
            
        order.subtotal = subtotal
        order.gst_total = gst_total
        order.grand_total = grand_total
        order.save()
        
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if request.user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
            return Response({"error": "Unauthorized. Only Admin can approve orders."}, status=status.HTTP_403_FORBIDDEN)
            
        order = self.get_object()
        if order.status not in [OrderStatus.PENDING_APPROVAL, OrderStatus.DRAFT, OrderStatus.SUBMITTED]:
            return Response({"error": f"Can only approve orders in Pending Approval status. Current: {order.status}"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Deduct inventory
        for item in order.items.all():
            product = item.product
            if product.stock < item.quantity:
                return Response({"error": f"Insufficient stock for {product.name} (Need {item.quantity}, Have {product.stock})."}, status=status.HTTP_400_BAD_REQUEST)
            product.stock -= item.quantity
            product.save()
            
        order.status = OrderStatus.APPROVED
        order.save()

        from .models import OrderTimeline
        OrderTimeline.objects.create(
            order=order,
            status=OrderStatus.APPROVED,
            remarks="Order approved by Admin",
            created_by=request.user
        )

        return Response({"message": "Order approved successfully and inventory updated.", "status": order.status})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if request.user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
            return Response({"error": "Unauthorized. Only Admin can reject orders."}, status=status.HTTP_403_FORBIDDEN)
            
        order = self.get_object()
        if order.status != OrderStatus.PENDING_APPROVAL:
            return Response({"error": f"Can only reject Pending Approval orders. Current: {order.status}"}, status=status.HTTP_400_BAD_REQUEST)
            
        order.status = OrderStatus.REJECTED
        order.save()

        from .models import OrderTimeline
        OrderTimeline.objects.create(
            order=order,
            status=OrderStatus.REJECTED,
            remarks=request.data.get('remarks', 'Order rejected by Admin'),
            created_by=request.user
        )

        return Response({"message": "Order rejected by Admin.", "status": order.status})

    @action(detail=True, methods=['post'])
    def upload_bilty(self, request, pk=None):
        if request.user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
            return Response({"error": "Unauthorized. Only Admin/Office can upload Bilty."}, status=status.HTTP_403_FORBIDDEN)
            
        order = self.get_object()
        if order.status not in [OrderStatus.APPROVED, OrderStatus.BILTY_UPLOADED]:
            return Response({"error": "Bilty can only be uploaded for Approved orders."}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.utils import timezone
        order.bilty_number = request.data.get('bilty_number', order.bilty_number or f"BILTY-{order.order_number}")
        if 'bilty_pdf' in request.FILES:
            order.bilty_pdf = request.FILES['bilty_pdf']
        order.bilty_date = timezone.now()
        order.bilty_uploaded_by = request.user
        order.status = OrderStatus.BILTY_UPLOADED
        order.save()

        from .models import OrderTimeline
        OrderTimeline.objects.create(
            order=order,
            status=OrderStatus.BILTY_UPLOADED,
            remarks=f"Office Bilty uploaded: {order.bilty_number}",
            created_by=request.user
        )

        return Response({"message": "Bilty PDF and details uploaded successfully.", "status": order.status, "bilty_number": order.bilty_number})

    @action(detail=True, methods=['post'])
    def mark_ready_dispatch(self, request, pk=None):
        if request.user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
            return Response({"error": "Unauthorized. Only Admin/Office can set Ready to Dispatch."}, status=status.HTTP_403_FORBIDDEN)
            
        order = self.get_object()
        if order.status != OrderStatus.BILTY_UPLOADED:
            return Response({"error": "Order must have Bilty uploaded (status: Bilty Uploaded) before setting Ready to Dispatch."}, status=status.HTTP_400_BAD_REQUEST)
            
        order.status = OrderStatus.READY_DISPATCH
        order.save()

        from .models import OrderTimeline
        OrderTimeline.objects.create(
            order=order,
            status=OrderStatus.READY_DISPATCH,
            remarks="Order marked Ready to Dispatch by Office",
            created_by=request.user
        )

        return Response({"message": "Order is now Ready to Dispatch for Warehouse.", "status": order.status})

    @action(detail=True, methods=['post'])
    def generate_lr(self, request, pk=None):
        order = self.get_object()
        
        # LOCKED CHECK: LR Generation is locked before Ready to Dispatch stage!
        if order.status != OrderStatus.READY_DISPATCH:
            return Response({
                "error": f"LR Generation is LOCKED! Order must be in 'Ready to Dispatch' status (Current: {order.status})."
            }, status=status.HTTP_400_BAD_REQUEST)
            
        from django.utils import timezone
        order.lr_number = request.data.get('lr_number', order.lr_number or f"LR-{order.order_number}")
        order.transport_details = request.data.get('transport_details', order.transport_details or 'Standard Logistics')
        order.vehicle_number = request.data.get('vehicle_number', order.vehicle_number or '')
        if 'lr_receipt_upload' in request.FILES:
            order.lr_receipt_upload = request.FILES['lr_receipt_upload']
            
        order.lr_date = timezone.now()
        order.lr_generated_by = request.user
        order.status = OrderStatus.DISPATCHED
        order.save()
        
        from .models import OrderTimeline
        OrderTimeline.objects.create(
            order=order,
            status=OrderStatus.DISPATCHED,
            remarks=f"Warehouse LR Generated: {order.lr_number} via {order.transport_details}",
            created_by=request.user
        )
        
        return Response({"message": "LR Generated successfully and order Dispatched.", "status": order.status, "lr_number": order.lr_number})
        
    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        order = self.get_object()
        from .models import OrderTimeline
        from .serializers import OrderTimelineSerializer
        timeline = OrderTimeline.objects.filter(order=order).order_by('-created_at')
        return Response(OrderTimelineSerializer(timeline, many=True).data)

from .models import Invoice
from .serializers import InvoiceSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
            return Invoice.objects.all().order_by('-created_at')
        elif user.role == UserRole.DEALER:
            return Invoice.objects.filter(order__dealer=user).order_by('-created_at')
        return Invoice.objects.none()
        
    @action(detail=True, methods=['get'])
    def generate_pdf(self, request, pk=None):
        invoice = self.get_object()
        # In a real app, you would use reportlab, weasyprint or xhtml2pdf here.
        # For now, we will return a mock URL or base64 structure.
        return Response({
            "message": "PDF generated",
            "invoice_number": invoice.invoice_number,
            "download_url": f"/media/invoices/{invoice.invoice_number}.pdf"
        })
