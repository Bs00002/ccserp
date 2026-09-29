from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
  path('django-admin/', admin.site.urls),
  path('api/', include('apps.accounts.api.urls')),
  path('api/admin/', include('apps.accounts.api.admin_urls')),
  path('api/crm/', include('apps.crm.urls')),
  path('api/', include('apps.products.urls')),
  path('api/', include('apps.orders.urls')),
  path('api/hr/', include('apps.hr.urls')),
  path('api/reports/', include('apps.reports.urls')),
  path('api/', include('apps.notifications.urls')),
  path('api/', include('apps.common.urls')),
  path('api/common/', include('apps.common.urls')),
  path('api/support/', include('apps.support.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
