from django.urls import path
from ..views import SendOTPView, RegisterView, LoginView, PublicDealerLocatorView, CookieTokenRefreshView, CurrentUserProfileView

urlpatterns = [
    path('auth/register-init/', SendOTPView.as_view(), name='auth_register_init'),
    path('auth/register-verify/', RegisterView.as_view(), name='auth_register_verify'),
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserProfileView.as_view(), name='current_user_profile'),
    path('public/dealers/', PublicDealerLocatorView.as_view(), name='public_dealer_locator'),
]
