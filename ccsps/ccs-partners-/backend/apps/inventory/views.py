from rest_framework import viewsets, permissions
from .models import Warehouse, Godown, StockLedger
from .serializers import WarehouseSerializer, GodownSerializer, StockLedgerSerializer

class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [permissions.IsAuthenticated]

class GodownViewSet(viewsets.ModelViewSet):
    queryset = Godown.objects.all()
    serializer_class = GodownSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        warehouse = self.request.query_params.get('warehouse')
        if warehouse:
            qs = qs.filter(warehouse_id=warehouse)
        return qs

class StockLedgerViewSet(viewsets.ModelViewSet):
    queryset = StockLedger.objects.all().order_by('-created_at')
    serializer_class = StockLedgerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        product = self.request.query_params.get('product')
        warehouse = self.request.query_params.get('warehouse')
        if product:
            qs = qs.filter(product_id=product)
        if warehouse:
            qs = qs.filter(warehouse_id=warehouse)
        return qs
