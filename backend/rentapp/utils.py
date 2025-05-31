import random
from django.core.mail import send_mail

def generate_code():
    return str(random.randint(100000, 999999))

def send_confirmation_code(email, code):
    send_mail(
        subject="Код подтверждения смены пароля",
        message=f"Ваш код подтверждения: {code}",
        from_email="noreply@yourapp.com",
        recipient_list=[email],
        fail_silently=False,
    )
