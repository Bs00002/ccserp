from django.contrib.auth import get_user_model
User = get_user_model()
for u in User.objects.all():
    print(f"Username: {u.username} | Email: {u.email} | Mobile: {getattr(u, 'mobile_number', '')} | Role: {getattr(u, 'role', '')}")
