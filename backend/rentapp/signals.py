# signals.py
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from django.utils import timezone

@receiver(user_logged_in)
def reset_verification_if_expired(sender, request, user, **kwargs):
    if user.passport_expiry and user.passport_expiry < timezone.now().date():
        user.email_confirmed = False
        user.save(update_fields=["email_confirmed"])
