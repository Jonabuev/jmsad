from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from rentapp.models import Notification, NotificationSettings
from rentapp.serializers import NotificationSerializer, NotificationSettingsSerializer


class NotificationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class NotificationListView(generics.ListAPIView):
    """
    Список уведомлений пользователя с фильтрацией и пагинацией
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotificationPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'priority', 'is_read']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'priority', 'type']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user)
        
        # Фильтр по дате (последние 30 дней по умолчанию)
        days = self.request.query_params.get('days', 30)
        if days:
            try:
                days = int(days)
                cutoff_date = timezone.now() - timedelta(days=days)
                queryset = queryset.filter(created_at__gte=cutoff_date)
            except ValueError:
                pass
        
        # Фильтр по статусу (непрочитанные)
        unread_only = self.request.query_params.get('unread_only', False)
        if unread_only:
            queryset = queryset.filter(is_read=False)
        
        return queryset


class NotificationDetailView(generics.RetrieveAPIView):
    """
    Детальная информация об уведомлении
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationMarkAsReadView(generics.UpdateAPIView):
    """
    Отметить уведомление как прочитанное
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.mark_as_read()
        return Response(self.get_serializer(notification).data)


class NotificationMarkAllAsReadView(APIView):
    """
    Отметить все уведомления как прочитанные
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated_count = Notification.objects.filter(
            user=request.user, 
            is_read=False
        ).update(is_read=True, read_at=timezone.now())
        
        return Response({
            'message': f'Отмечено как прочитанные {updated_count} уведомлений',
            'updated_count': updated_count
        })


class NotificationUnreadCountView(APIView):
    """
    Получить количество непрочитанных уведомлений
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            user=request.user, 
            is_read=False
        ).count()
        
        return Response({'unread_count': count})


class NotificationSettingsView(generics.RetrieveUpdateAPIView):
    """
    Получить и обновить настройки уведомлений пользователя
    """
    serializer_class = NotificationSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        settings, created = NotificationSettings.objects.get_or_create(
            user=self.request.user,
            defaults={}
        )
        return settings


class NotificationDeleteView(generics.DestroyAPIView):
    """
    Удалить уведомление
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.delete()
        return Response({'message': 'Уведомление удалено'}, status=status.HTTP_204_NO_CONTENT)


class NotificationBulkDeleteView(APIView):
    """
    Массовое удаление уведомлений
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        notification_ids = request.data.get('notification_ids', [])
        if not notification_ids:
            return Response({'error': 'Список ID уведомлений не предоставлен'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        deleted_count = Notification.objects.filter(
            user=request.user,
            id__in=notification_ids
        ).delete()[0]
        
        return Response({
            'message': f'Удалено {deleted_count} уведомлений',
            'deleted_count': deleted_count
        })

