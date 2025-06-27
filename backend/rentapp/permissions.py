from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwner(BasePermission):
    """
    Разрешение только для владельца объекта (house.owner == request.user)
    """
    def has_object_permission(self, request, view, obj):
        return hasattr(obj, 'owner') and obj.owner == request.user

class IsLandlord(BasePermission):
    """
    Разрешение только для пользователей с ролью 'landlord'
    """
    def has_permission(self, request, view):
        return hasattr(request.user, 'role') and request.user.role == 'landlord'

class IsTenant(BasePermission):
    """
    Разрешение только для пользователей с ролью 'tenant'
    """
    def has_permission(self, request, view):
        return hasattr(request.user, 'role') and request.user.role == 'tenant'

class IsOwnerOrReadOnly(BasePermission):
    """
    Только владелец может изменять объект, остальные только читать
    """
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return hasattr(obj, 'owner') and obj.owner == request.user 