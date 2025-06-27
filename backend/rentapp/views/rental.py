from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from django.shortcuts import get_object_or_404
from datetime import datetime, date
import calendar

from django.db.models import Q, Prefetch

from rentapp.models import Favorite, Rental, House
from rentapp.serializers import (
    FavoriteSerializer,
    RentalSerializer,
    MyRentalSerializer,
    RentalRequestSerializer,
    HouseSerializer,
)
from rentapp.notifications import send_rental_confirmation_notification
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny
from rest_framework import generics
from rentapp.services.rental_service import RentalService
from rentapp.exceptions import RentAppException
from rentapp.cache import HouseCache, invalidate_house_cache
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from rentapp.permissions import IsOwner, IsLandlord, IsTenant, IsOwnerOrReadOnly

class MyRentalsAPIView(generics.ListAPIView):
    """
    API endpoint для получения списка аренд текущего пользователя.
    
    Возвращает активные аренды в зависимости от роли пользователя:
    - Для арендаторов: аренды, где они являются tenant
    - Для арендодателей: аренды, где они являются владельцем дома
    
    Permissions:
        - Требуется аутентификация
    """
    serializer_class = MyRentalSerializer
    permission_classes = [IsAuthenticated, IsTenant | IsLandlord]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'house__address']
    search_fields = ['house__address', 'house__region', 'house__city']
    ordering_fields = ['start_date', 'end_date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'tenant':
            return Rental.objects.select_related(
                'house', 'house__owner', 'tenant'
            ).filter(tenant=user, status='active')
        elif user.role == 'landlord':
            return Rental.objects.select_related(
                'house', 'house__owner', 'tenant'
            ).filter(house__owner=user, status='active')
        else:
            return Rental.objects.none()  # Неверная роль пользователя



class RentalListCreateView(generics.ListCreateAPIView):
    """
    API endpoint для получения списка всех аренд и создания новых.
    
    GET: Возвращает список всех аренд
    POST: Создает новую аренду, привязывая её к текущему пользователю
    
    Permissions:
        - Требуется аутентификация
    """
    serializer_class = RentalSerializer
    permission_classes = [IsAuthenticated, IsLandlord]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'house', 'tenant']
    search_fields = ['house__address', 'house__region', 'house__city']
    ordering_fields = ['start_date', 'end_date', 'created_at']

    def get_queryset(self):
        return Rental.objects.select_related(
            'house', 'house__owner', 'tenant'
        ).all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RentalDetailView(APIView):
    """
    API endpoint для обновления статуса аренды.
    
    PUT: Обновляет статус аренды (только для владельца дома)
    
    Permissions:
        - Требуется аутентификация
        - Только владелец дома может изменять статус
    """
    permission_classes = [IsAuthenticated, IsLandlord]

    def put(self, request, pk):
        try:
            result = RentalService.update_rental_status(pk, request.data.get('status'), request.user)
            return Response(result)
        except RentAppException as e:
            return Response({'error': e.message}, status=status.HTTP_400_BAD_REQUEST)


class CreateRentalRequest(APIView):
    """
    API endpoint для создания заявки на аренду.
    
    POST: Создает новую заявку на аренду дома
    
    Required fields:
        - house_id: ID дома для аренды
        - start_date: Дата начала аренды (YYYY-MM-DD)
        - end_date: Дата окончания аренды (YYYY-MM-DD)
    
    Permissions:
        - Требуется аутентификация
    """
    permission_classes = [IsAuthenticated, IsTenant]

    def post(self, request):
        try:
            result = RentalService.create_rental_request(
                house_id=request.data.get("house_id"),
                tenant=request.user,
                start_date=request.data.get("start_date"),
                end_date=request.data.get("end_date")
            )
            return Response(result, status=status.HTTP_201_CREATED)
        except RentAppException as e:
            return Response({"error": e.message}, status=status.HTTP_400_BAD_REQUEST)


class RentalRequestListView(generics.ListAPIView):
    """
    API endpoint для получения списка заявок на аренду.
    
    Возвращает заявки на аренду домов, принадлежащих текущему арендодателю.
    
    Permissions:
        - Требуется аутентификация
        - Только для арендодателей
    """
    serializer_class = RentalRequestSerializer
    permission_classes = [IsAuthenticated, IsLandlord]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'house']
    search_fields = ['house__address', 'house__region', 'house__city']
    ordering_fields = ['start_date', 'end_date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role != "landlord":
            return Rental.objects.none()  # Возвращаем пустой queryset для не-арендодателей
        return Rental.objects.select_related(
            'house', 'house__owner', 'tenant'
        ).filter(house__owner=user)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsLandlord])
def confirm_rental(request, rental_id):
    """
    API endpoint для подтверждения аренды.
    
    Подтверждает заявку на аренду, изменяя статус с 'pending' на 'active'.
    Отправляет уведомление арендатору о подтверждении.
    
    Permissions:
        - Требуется аутентификация
        - Только владелец дома может подтверждать аренду
    """
    try:
        result = RentalService.confirm_rental(rental_id, request.user)
        return Response(result, status=status.HTTP_200_OK)
    except RentAppException as e:
        return Response({'error': e.message}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsLandlord])
def reject_rental(request, rental_id):
    """
    API endpoint для отклонения аренды.
    
    Отклоняет заявку на аренду, изменяя статус на 'declined'.
    
    Permissions:
        - Требуется аутентификация
        - Только владелец дома может отклонять аренду
    """
    try:
        result = RentalService.reject_rental(rental_id, request.user)
        return Response(result, status=status.HTTP_200_OK)
    except RentAppException as e:
        return Response({'error': e.message}, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsLandlord])
def create_apartment(request):
    """
    API endpoint для создания новой квартиры/дома.
    
    Создает новый объект недвижимости для текущего пользователя.
    Требует подтверждения email перед созданием.
    
    Permissions:
        - Требуется аутентификация
        - Требуется подтверждение email
    """
    if not request.user.email_confirmed:
        return Response(
            {"detail": "Подтвердите свою почту перед добавлением недвижимости."},
            status=status.HTTP_403_FORBIDDEN
        )
    serializer = HouseSerializer(data=request.data, context={'request': request})
    print("Полученные данные:", request.data)
    if serializer.is_valid():
        house = serializer.save()
        # Инвалидируем кэш домов после создания нового
        invalidate_house_cache()
        return Response({
            "message": "Недвижимость успешно добавлена",
            "data": HouseSerializer(house).data
        }, status=status.HTTP_201_CREATED)

    # Печатаем в консоль и возвращаем человекочитаемый ответ
    print("Ошибка сериализации:", serializer.errors)

    return Response({
        "message": "Ошибка при создании недвижимости",
        "errors": serializer.errors
     }, status=status.HTTP_400_BAD_REQUEST)



class AvailableHousesView(APIView):
    """
    API endpoint для получения списка доступных домов.
    
    Возвращает дома, которые не забронированы в указанный период.
    
    Query Parameters:
        - start_date: Дата начала периода (YYYY-MM-DD, по умолчанию первый день текущего месяца)
        - end_date: Дата окончания периода (YYYY-MM-DD, по умолчанию последний день текущего месяца)
    
    Permissions:
        - Доступно всем пользователям
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            start_date = request.GET.get('start_date')
            end_date = request.GET.get('end_date')
            
            # Используем кэширование для доступных домов
            available_houses = HouseCache.get_available_houses(start_date, end_date)
            serializer = HouseSerializer(available_houses, many=True)
            
            return Response(serializer.data)
        except RentAppException as e:
            return Response({'error': e.message}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_rental(request, rental_id):
    """
    API endpoint для отклонения аренды.
    
    Отклоняет заявку на аренду, изменяя статус на 'declined'.
    
    Permissions:
        - Требуется аутентификация
        - Только владелец дома может отклонять аренду
    """
    try:
        result = RentalService.reject_rental(rental_id, request.user)
        return Response(result, status=status.HTTP_200_OK)
    except RentAppException as e:
        return Response({'error': e.message}, status=status.HTTP_400_BAD_REQUEST)


class AllHousesView(generics.ListAPIView):
    """
    API endpoint для получения списка всех домов.
    
    Возвращает все дома в системе без фильтрации.
    
    Permissions:
        - Доступно всем пользователям
    """
    queryset = House.objects.select_related('owner').all()
    serializer_class = HouseSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['region', 'city', 'district', 'owner']
    search_fields = ['address', 'region', 'city', 'district']
    ordering_fields = ['created_at', 'address']


class FavoriteListCreateView(generics.ListCreateAPIView):
    """
    API endpoint для работы с избранными домами.
    
    GET: Возвращает список избранных домов текущего пользователя
    POST: Добавляет дом в избранное
    
    Permissions:
        - Требуется аутентификация
    """
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated, IsTenant | IsLandlord]

    def get_queryset(self):
        return Favorite.objects.select_related(
            'user', 'house', 'house__owner'
        ).filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
