from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from ..models import IdentityVerification, CustomUser
from ..serializers import ImageUploadSerializer

class ManualVerificationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        """
        Ручная верификация документа администратором
        """
        # Проверяем, что пользователь является администратором
        if not request.user.is_superuser:
            return Response(
                {"error": "Только администраторы могут выполнять ручную верификацию"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        verification_approved = request.data.get('verification_approved', False)
        
        if not user_id:
            return Response(
                {"error": "Необходимо указать user_id"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "Пользователь не найден"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if verification_approved:
            try:
                with transaction.atomic():
                    user.email_confirmed = True
                    user.save()
                    
                    # Создаем запись о верификации
                    IdentityVerification.objects.get_or_create(
                        user=user,
                        defaults={'verified': True}
                    )
                    
                    # Отправляем уведомление
                    send_mail(
                        'Документ верифицирован',
                        'Ваш документ был успешно верифицирован администратором.',
                        settings.DEFAULT_FROM_EMAIL,
                        [user.email],
                        fail_silently=False,
                    )
                
                return Response({
                    "message": "Документ успешно верифицирован",
                    "user_id": user_id,
                    "username": user.username
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                return Response({
                    "error": f"Ошибка при верификации: {str(e)}"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Отклонение верификации
            try:
                with transaction.atomic():
                    user.email_confirmed = False
                    user.save()
                    
                    # Удаляем запись о верификации
                    IdentityVerification.objects.filter(user=user).delete()
                    
                    # Отправляем уведомление об отклонении
                    send_mail(
                        'Документ отклонен',
                        'Ваш документ был отклонен. Пожалуйста, загрузите корректный документ.',
                        settings.DEFAULT_FROM_EMAIL,
                        [user.email],
                        fail_silently=False,
                    )
                
                return Response({
                    "message": "Документ отклонен",
                    "user_id": user_id,
                    "username": user.username
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                return Response({
                    "error": f"Ошибка при отклонении: {str(e)}"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PendingVerificationsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        """
        Получение списка документов, ожидающих верификации
        """
        # Проверяем, что пользователь является администратором
        if not request.user.is_superuser:
            return Response(
                {"error": "Только администраторы могут просматривать список верификаций"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Получаем пользователей с загруженными документами, но не верифицированными
        pending_verifications = []
        
        for verification in IdentityVerification.objects.filter(verified=False):
            pending_verifications.append({
                'user_id': verification.user.id,
                'username': verification.user.username,
                'email': verification.user.email,
                'identifier': verification.user.identifier,
                'document_type': verification.user.document_type,
                'passport_expiry': verification.user.passport_expiry,
                'uploaded_at': verification.id_document.name if verification.id_document else None,
                'verification_id': verification.id
            })
        
        return Response({
            "pending_verifications": pending_verifications,
            "count": len(pending_verifications)
        }, status=status.HTTP_200_OK) 