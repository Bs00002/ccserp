from datetime import datetime, date
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Count, F
from apps.orders.models import Order
from apps.hr.models import Attendance, Expense
from apps.accounts.models import User, UserRole

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def generate_report(request):
    report_type = request.query_params.get('type')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    if not all([report_type, start_date, end_date]):
        return Response({"error": "type, start_date, and end_date are required"}, status=400)
        
    try:
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
    except ValueError:
        return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)

    if request.user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        return Response({"error": "Unauthorized"}, status=403)

    if report_type == 'sales':
        # Daily sales aggregation
        qs = Order.objects.filter(created_at__date__gte=start, created_at__date__lte=end, status='Approved')
        data = list(qs.values(date=F('created_at__date')).annotate(total=Sum('grand_total')).order_by('date'))
        return Response({"report_type": "Sales", "data": data})
        
    elif report_type == 'dealer':
        # Sales per dealer
        qs = Order.objects.filter(created_at__date__gte=start, created_at__date__lte=end)
        data = list(qs.values(dealer_name=F('dealer__username')).annotate(total_orders=Count('id'), total_sales=Sum('grand_total')).order_by('-total_sales'))
        return Response({"report_type": "Dealer Performance", "data": data})

    elif report_type == 'expense':
        # Expenses per employee
        qs = Expense.objects.filter(date__gte=start, date__lte=end, status='Approved')
        data = list(qs.values(employee_name=F('employee__username')).annotate(total_expenses=Sum('amount')).order_by('-total_expenses'))
        return Response({"report_type": "Employee Expenses", "data": data})

    return Response({"error": "Unknown report type"}, status=400)
