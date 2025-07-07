from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from django.utils import timezone
from rentapp.models import BlacklistEntry

ALLOWED_PATHS_FOR_EXPIRED = [
    "/api/token/",
    "/api/token/refresh/",
    "/api/profile/edit/",
    "/api/apartments/create/",
    "/api/apartments/",
    "/api/verify-identity/",
    "/api/verify-identity1/",
    "/api/complaints/<int:complaint_id>/update/",
    "/api/complaints/submit/",
    "/api/house-locations/",
    "/api/complaint-reasons/",
    "/api/tenant-registry/",
    "/api/user/profile/<str:username>/",
    "/api/tenant-registry1/",
    "/api/complaint/<int:complaint_id>/comment/",
    "/api/support-complaint/",
    "/api/recommend-tenants/",
    "/api/forum/",
    "/api/forum/filters/",
    "/api/analitics/",
    "/api/analiticsML/",
    "/api/forum-add/<int:complaint_id>/",
    "/api/complaints/<int:pk>/status/",
    "/api/complaints1/<int:pk>/status/",
    "/api/complaints/<int:complaint_id>/dispute/",
    "/api/user-info/",
    "/api/auth/google/",
    "/api/complaints/<uuid:uuid>/",
    "/api/register/",
    "/api/rental-complaints/create/",
    "/api/my-rentals/",
    "/api/rentals/",
    "/api/rentals/<int:pk>/",
    "/api/rental-requests/",
    "/api/rent-house/",
    "/api/roc-curve/",
    "/api/landlords/",
    "/api/favorites/",
    "/api/chat-threads/",
    "/api/chat-messages/<int:thread_id>/",
    "/api/notifications/",
    "/api/notifications/<int:pk>/mark-as-read/",
    "/api/available-houses/",
    "/api/all-complaint-reasons/",
    "/api/request-password-reset/",
    "/api/request-password-change/",
    "/api/confirm-password-change/",
    "/api/complaint-reasons/tenant/",
    "/api/complaint-reasons/landlord/",
    "/api/profile/",
    "/api/login/",
    "/api/all-houses/",
    "/api/rentals/<int:rental_id>/confirm/",
    "/api/rentals/<int:rental_id>/reject/",
    "/api/anonymous-name/regenerate/",
    "/api/anonymous-name/",
    "/api/issue-violation/",
    "/api/remove-ban/",
    "/api/rental-complaints/<uuid:uuid>/update/",
    "/api/rental-complaints/<uuid:uuid>/"

]

import re

def is_path_allowed(path):
    for pattern in ALLOWED_PATHS_FOR_EXPIRED:
        # Заменим Django-подобные <int:id> и т.п. на regex
        regex = pattern.replace("<int:pk>", r"\d+").replace("<int:complaint_id>", r"\d+").replace("<int:rental_id>", r"\d+").replace("<int:thread_id>", r"\d+").replace("<int:pk>", r"\d+").replace("<uuid:uuid>", r"[0-9a-f\-]+").replace("<str:username>", r"[^/]+")
        if re.fullmatch(regex, path):
            return True
    return False

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
                if not is_path_allowed(request.path):
                    raise PermissionDenied("Document expired. Access denied.")


        return (user, validated_token)
