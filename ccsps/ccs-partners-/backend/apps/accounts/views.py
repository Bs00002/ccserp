from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.utils import timezone
from .serializers import SendOTPSerializer, RegisterSerializer, LoginSerializer
from .services import OTPService, AuthService
from .models import UserStatus

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class SendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            OTPService.generate_and_send_otp(email)
            return Response({"message": "OTP sent successfully to email."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']
            
            if not OTPService.verify_otp(email, otp):
                return Response({"error": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)
                
            user = AuthService.register_user(
                email=email,
                username=serializer.validated_data['username'],
                password=serializer.validated_data['password'],
                phone=serializer.validated_data.get('phone', ''),
                role=serializer.validated_data['role']
            )
            
            return Response({
                "message": "Registration successful. Your account is pending admin approval."
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = AuthService.authenticate_user(
                serializer.validated_data['email_or_username'],
                serializer.validated_data['password']
            )
            
            if not user:
                return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
                
            if user.status == UserStatus.PENDING:
                return Response({"error": "Your account is pending admin approval."}, status=status.HTTP_403_FORBIDDEN)
                
            if user.status == UserStatus.REJECTED:
                return Response({"error": "Your account has been rejected."}, status=status.HTTP_403_FORBIDDEN)
                
            if not user.is_active:
                return Response({"error": "Your account is disabled."}, status=status.HTTP_403_FORBIDDEN)

            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])

            tokens = get_tokens_for_user(user)
            
            response = Response({
                "message": "Login successful",
                "access_token": tokens["access"],
                "refresh_token": tokens["refresh"],
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "role": user.role,
                    "km_rate": float(user.km_rate) if user.km_rate is not None else None,
                }
            }, status=status.HTTP_200_OK)
            
            # Set Refresh Token in HttpOnly Cookie
            cookie_max_age = 3600 * 24 * 7 # 7 days
            response.set_cookie(
                key=settings.SIMPLE_JWT.get('AUTH_COOKIE', 'refresh_token'),
                value=tokens["refresh"],
                expires=cookie_max_age,
                secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
                httponly=settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True),
                samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax')
            )
            
            return response
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PublicDealerLocatorView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from .models import User, UserRole, UserStatus
        
        # Get all approved dealers
        dealers = User.objects.filter(role=UserRole.DEALER, status=UserStatus.APPROVED).select_related('dealer_profile')
        
        # Filter by search term
        search = request.GET.get('search', '').lower()
        
        results = []
        for dealer in dealers:
            profile = getattr(dealer, 'dealer_profile', None)
            if not profile:
                continue
                
            name = profile.company_name or dealer.username or "Dealer"
            city = profile.city or ""
            district = profile.district or ""
            state = profile.state or ""
            
            if search:
                if search not in name.lower() and search not in city.lower() and search not in district.lower() and search not in state.lower():
                    continue
                    
            results.append({
                "id": str(dealer.id),
                "name": name,
                "city": city,
                "district": district,
                "state": state,
                "address": profile.address or "",
                "phone": dealer.phone or "",
                "email": dealer.email
            })
            
        return Response(results, status=status.HTTP_200_OK)


from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.permissions import IsAuthenticated

class CookieTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if 'refresh' not in data and 'refresh_token' in request.COOKIES:
            data['refresh'] = request.COOKIES['refresh_token']
        serializer = self.get_serializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

class CurrentUserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .serializers import UserSerializer
        user = request.user
        data = UserSerializer(user).data
        data['km_rate'] = float(user.km_rate) if user.km_rate is not None else None
        return Response(data)

