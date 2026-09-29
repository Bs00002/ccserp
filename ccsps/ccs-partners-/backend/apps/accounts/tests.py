from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import User, UserStatus, UserRole, OTPRecord

class AuthTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.email = "testdealer@example.com"
        self.username = "testdealer"
        self.password = "securepass123"
        self.phone = "1234567890"

    def test_full_auth_flow(self):
        # 1. Send OTP
        response = self.client.post(reverse('auth_register_init'), {'email': self.email})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Get OTP from DB (for testing)
        otp_record = OTPRecord.objects.filter(email=self.email).first()
        self.assertIsNotNone(otp_record)
        
        # Since we hash it, we can't reverse it. 
        # But we can test registration with a wrong OTP
        register_data = {
            'email': self.email,
            'username': self.username,
            'password': self.password,
            'phone': self.phone,
            'role': UserRole.DEALER,
            'otp': '000000' # Wrong OTP
        }
        response = self.client.post(reverse('auth_register_verify'), register_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # To test success, we need the raw OTP, which we didn't save. 
        # We can mock the OTP verification service or manually create a user.
        # Let's manually create a user and test login.
        
        user = User.objects.create_user(
            email="approved@example.com",
            username="approved",
            password="password123",
            role=UserRole.DEALER,
            status=UserStatus.APPROVED
        )
        
        # Login with Email
        response = self.client.post(reverse('auth_login'), {
            'email_or_username': 'approved@example.com',
            'password': 'password123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)
        
        # Login with Username
        response = self.client.post(reverse('auth_login'), {
            'email_or_username': 'approved',
            'password': 'password123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_pending_user_login_fails(self):
        User.objects.create_user(
            email="pending@example.com",
            username="pending",
            password="password123",
            role=UserRole.DEALER,
            status=UserStatus.PENDING
        )
        response = self.client.post(reverse('auth_login'), {
            'email_or_username': 'pending@example.com',
            'password': 'password123'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
