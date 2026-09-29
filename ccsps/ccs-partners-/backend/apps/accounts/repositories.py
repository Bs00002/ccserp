from .models import User, OTPRecord, DealerProfile, DistributorProfile, EmployeeProfile, AdminProfile, UserRole

class UserRepository:
    @staticmethod
    def create_user(email, username, password, phone, role, status):
        user = User(
            email=email,
            username=username,
            phone=phone,
            role=role,
            status=status
        )
        user.set_password(password)
        user.save()
        return user

    @staticmethod
    def get_user_by_email(email):
        return User.objects.filter(email=email).first()

    @staticmethod
    def get_user_by_username(username):
        return User.objects.filter(username=username).first()

class ProfileRepository:
    @staticmethod
    def create_profile(user):
        if user.role == UserRole.DEALER:
            return DealerProfile.objects.create(user=user)
        elif user.role == UserRole.DISTRIBUTOR:
            return DistributorProfile.objects.create(user=user)
        elif user.role == UserRole.EMPLOYEE:
            return EmployeeProfile.objects.create(user=user)
        elif user.role == UserRole.ADMIN or user.role == UserRole.SUPER_ADMIN:
            return AdminProfile.objects.create(user=user)
        return None

class OTPRepository:
    @staticmethod
    def create_otp_record(email, otp_hash, expires_at):
        return OTPRecord.objects.create(
            email=email,
            otp_hash=otp_hash,
            expires_at=expires_at
        )

    @staticmethod
    def get_valid_otp_record(email):
        return OTPRecord.objects.filter(
            email=email,
            is_used=False
        ).order_by('-created_at').first()

    @staticmethod
    def mark_as_used(otp_record):
        otp_record.is_used = True
        otp_record.save()
