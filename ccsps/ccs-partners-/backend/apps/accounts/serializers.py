from rest_framework import serializers
from .models import UserRole, User

class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=UserRole.choices)
    otp = serializers.CharField(max_length=6)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
        
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

class LoginSerializer(serializers.Serializer):
    email_or_username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class KYCProfileSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import KYCProfile
        model = KYCProfile
        fields = '__all__'

class DealerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import DealerProfile
        model = DealerProfile
        fields = '__all__'

class DistributorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import DistributorProfile
        model = DistributorProfile
        fields = '__all__'

class EmployeeProfileSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import EmployeeProfile
        model = EmployeeProfile
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    kyc_profile = KYCProfileSerializer(read_only=True)
    dealer_profile = DealerProfileSerializer(read_only=True)
    distributor_profile = DistributorProfileSerializer(read_only=True)
    employee_profile = EmployeeProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'ccs_id', 'email', 'username', 'phone', 'role', 'status', 'is_active', 'is_verified', 'joining_date', 'km_rate', 'created_at', 'kyc_profile', 'dealer_profile', 'distributor_profile', 'employee_profile']
