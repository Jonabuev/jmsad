# permissions.py
from rest_framework.permissions import BasePermission
from rentapp.models import BlacklistEntry

class NotBlacklistedOrProfileEdit(BasePermission):
    """
    Разрешает доступ, если пользователь не в blacklist или он на странице профиля/редактирования профиля.
    """
    def has_permission(self, request, view):
        user = request.user
        path = request.path

        if not user.is_authenticated:
            return False

        # Разрешён доступ к профилю и его редактированию
        if path.startswith("/api/profile") or path.startswith("/api/profile/edit"):
            return True

        # Проверка на блокировку
        try:
            entry = user.blacklist
            if entry.reason == "violation":
                return False
            elif entry.reason == "expired_document":
                return False
        except BlacklistEntry.DoesNotExist:
            pass

        return True
