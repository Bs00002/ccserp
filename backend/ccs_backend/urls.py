import os
from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from django.http import FileResponse, Http404
from apps.reports.views import dashboard_summary


def serve_apk(request):
    """
    Publicly serve the signed Android APK for CCS Connect.
    """
    candidates = [
        os.path.join(settings.BASE_DIR, '..', 'public', 'downloads', 'CCS-Connect.apk'),
        os.path.join(settings.BASE_DIR, '..', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
        os.path.join(settings.MEDIA_ROOT, 'downloads', 'CCS-Connect.apk'),
    ]
    for path_candidate in candidates:
        if os.path.exists(path_candidate):
            response = FileResponse(open(path_candidate, 'rb'), content_type='application/vnd.android.package-archive')
            response['Content-Disposition'] = 'attachment; filename="CCS-Connect.apk"'
            response['Content-Length'] = os.path.getsize(path_candidate)
            return response
    raise Http404("CCS Connect APK not found")


urlpatterns = [
    path('downloads/CCS-Connect.apk', serve_apk, name='download_apk'),
    path('django-admin/', admin.site.urls),
    path('api/dashboard/', dashboard_summary, name='dashboard_summary_alias'),
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
    path('api/wallet/', include('apps.wallet.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

