from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, BasePermission, SAFE_METHODS
from apps.accounts.models import UserRole
from .models import Category, SubCategory, Brand, Product
from .serializers import CategorySerializer, SubCategorySerializer, BrandSerializer, ProductSerializer

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('-created_at')
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['name']

class SubCategoryViewSet(viewsets.ModelViewSet):
    queryset = SubCategory.objects.select_related('category').all().order_by('-created_at')
    serializer_class = SubCategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ['category']
    search_fields = ['name']

class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all().order_by('-created_at')
    serializer_class = BrandSerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['name']

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category', 'sub_category', 'brand').all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ['category', 'sub_category', 'brand', 'status']
    search_fields = ['name', 'technical_name', 'crop', 'disease']
