from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from django.utils import timezone
from rentapp.models import BlacklistEntry

ALLOWED_PATHS_FOR_EXPIRED = ["/api/profile", "/api/profile/edit-profile", "/api/logout"]


class CustomJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)

        if result is None:
            return None

        user, validated_token = result

        # Проверка даты документа
        # Проверка даты документа
        passport_expiry = getattr(user, 'passport_expiry', None)
        if passport_expiry and passport_expiry < timezone.now().date():
            if user.email_confirmed:
                user.email_confirmed = False
                user.save(update_fields=['email_confirmed'])

            # Добавим в blacklist если ещё не добавлен
            if not hasattr(user, 'blacklist'):
                BlacklistEntry.objects.create(user=user, reason="expired_document")

                # Удалим IdentityVerification
                from rentapp.models import IdentityVerification
                IdentityVerification.objects.filter(user=user).delete()


        # Проверка blacklist
        entry = getattr(user, 'blacklist', None)
        if entry:
            if entry.reason == "violation":
                raise AuthenticationFailed("Your account is permanently blocked.")
            elif entry.reason == "expired_document":
                if not any(request.path.startswith(path) for path in ALLOWED_PATHS_FOR_EXPIRED):
                    raise PermissionDenied("Document expired. Access denied.")


        return (user, validated_token)
