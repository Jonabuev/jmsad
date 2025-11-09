# from rest_framework.permissions import BasePermission, SAFE_METHODS

# class IsOwner(BasePermission):
#     """
#     Разрешение только для владельца объекта (house.owner == request.user)
#     """
#     def has_object_permission(self, request, view, obj):
#         return hasattr(obj, 'owner') and obj.owner == request.user

# class IsLandlord(BasePermission):
#     """
#     Разрешение только для пользователей с ролью 'landlord'
#     """
#     def has_permission(self, request, view):
#         return hasattr(request.user, 'role') and request.user.role == 'landlord'

# class IsTenant(BasePermission):
#     """
#     Разрешение только для пользователей с ролью 'tenant'
#     """
#     def has_permission(self, request, view):
#         return hasattr(request.user, 'role') and request.user.role == 'tenant'

# class IsOwnerOrReadOnly(BasePermission):
#     """
#     Только владелец может изменять объект, остальные только читать
#     """
#     def has_object_permission(self, request, view, obj):
#         if request.method in SAFE_METHODS:
#             return True
#         return hasattr(obj, 'owner') and obj.owner == request.user 
    
# class IsAdmin(BasePermission):
#     """
#     Разрешение только для  'admin'
#     """
#     def has_permission(self, request, view):
#             return (
#                 request.user and 
#                 request.user.is_authenticated and 
#                 getattr(request.user, "is_superuser", False) is True
#             )


# class IsTenantOrLandlordOrAdmin(BasePermission):
#     def has_permission(self, request, view):
#         return (
#             request.user and request.user.is_authenticated and (
#                 request.user.role in ["tenant", "landlord"] or
#                 getattr(request.user, "is_superuser", False)
#             )
#         )
