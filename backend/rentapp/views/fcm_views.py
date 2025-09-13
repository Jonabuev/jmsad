from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from ..models import FCMToken
from ..serializers import FCMTokenSerializer
from ..notifications import send_push_notification
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class FCMTokenListCreateView(generics.ListCreateAPIView):
    """
    API для получения списка и создания FCM токенов пользователя
    """
    serializer_class = FCMTokenSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return FCMToken.objects.filter(user=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FCMTokenDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API для получения, обновления и удаления конкретного FCM токена
    """
    serializer_class = FCMTokenSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return FCMToken.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_fcm_token(request):
    """
    Регистрация FCM токена для пользователя
    """
    try:
        token = request.data.get('token')
        device_type = request.data.get('device_type', 'web')
        device_info = request.data.get('device_info', {})
        
        if not token:
            return Response(
                {'error': 'FCM токен обязателен'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Создаем или обновляем токен
        fcm_token, created = FCMToken.objects.get_or_create(
            token=token,
            defaults={
                'user': request.user,
                'device_type': device_type,
                'device_info': device_info,
                'is_active': True
            }
        )
        
        if not created:
            # Обновляем существующий токен
            fcm_token.user = request.user
            fcm_token.device_type = device_type
            fcm_token.device_info = device_info
            fcm_token.is_active = True
            fcm_token.save()
        
        serializer = FCMTokenSerializer(fcm_token)
        
        return Response({
            'message': 'FCM токен успешно зарегистрирован',
            'token': serializer.data,
            'created': created
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Ошибка регистрации FCM токена: {e}")
        return Response(
            {'error': 'Ошибка регистрации токена'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unregister_fcm_token(request, token):
    """
    Удаление FCM токена пользователя
    """
    try:
        fcm_token = FCMToken.objects.filter(
            user=request.user, 
            token=token
        ).first()
        
        if not fcm_token:
            return Response(
                {'error': 'FCM токен не найден'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        fcm_token.delete()
        
        return Response({
            'message': 'FCM токен успешно удален'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Ошибка удаления FCM токена: {e}")
        return Response(
            {'error': 'Ошибка удаления токена'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_push_notification(request):
    """
    Тестовая отправка push уведомления текущему пользователю
    """
    try:
        # Отправляем тестовое уведомление
        result = send_push_notification(
            user=request.user,
            title="Тестовое уведомление",
            body="Это тестовое push уведомление от ARNO",
            data={
                'type': 'test',
                'url': '/notifications'
            }
        )
        
        if result:
            return Response({
                'message': 'Тестовое push уведомление отправлено',
                'result': result
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'message': 'Push уведомление не отправлено (нет активных токенов)'
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"Ошибка отправки тестового push уведомления: {e}")
        return Response(
            {'error': 'Ошибка отправки push уведомления'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fcm_token_stats(request):
    """
    Статистика по FCM токенам пользователя
    """
    try:
        tokens = FCMToken.objects.filter(user=request.user)
        
        stats = {
            'total_tokens': tokens.count(),
            'active_tokens': tokens.filter(is_active=True).count(),
            'device_types': {
                'web': tokens.filter(device_type='web').count(),
                'android': tokens.filter(device_type='android').count(),
                'ios': tokens.filter(device_type='ios').count(),
                'desktop': tokens.filter(device_type='desktop').count(),
            },
            'last_used': tokens.order_by('-last_used').first().last_used if tokens.exists() else None
        }
        
        return Response(stats, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Ошибка получения статистики FCM токенов: {e}")
        return Response(
            {'error': 'Ошибка получения статистики'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
