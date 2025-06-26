from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from django.shortcuts import get_object_or_404
from datetime import datetime, date
import calendar
from django.db.models import Q
from rentapp.models import Rental, House
from rentapp.serializers import RentalSerializer, MyRentalSerializer, RentalRequestSerializer, HouseSerializer
from rentapp.notifications import send_rental_confirmation_notification
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny

class MyRentalsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'tenant':
            rentals = Rental.objects.filter(tenant=user, status='active')
        elif user.role == 'landlord':
            rentals = Rental.objects.filter(house__owner=user, status='active')
        else:
            return Response({"detail": "Неверная роль пользователя."}, status=403)

        serializer = MyRentalSerializer(rentals, many=True)
        return Response(serializer.data)



class RentalListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rentals = Rental.objects.all()
        serializer = RentalSerializer(rentals, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = RentalSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)  # Привязываем к текущему юзеру
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RentalDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        rental = get_object_or_404(Rental, pk=pk)

        # Проверяем, что арендодатель меняет статус
        if rental.house.owner != request.user:
            return Response({'detail': 'Нет доступа.'}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        allowed_statuses = {'active', 'declined'}  # Только эти статусы можно установить

        if new_status not in allowed_statuses:
            return Response({'detail': 'Неверный статус.'}, status=status.HTTP_400_BAD_REQUEST)

        rental.status = new_status
        rental.save()

        return Response({'status': rental.status})


class CreateRentalRequest(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        house_id = request.data.get("house_id")
        start_date = request.data.get("start_date")
        end_date = request.data.get("end_date")

        if not all([house_id, start_date, end_date]):
            return Response({"error": "Все поля обязательны."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            house = House.objects.get(id=house_id)
        except House.DoesNotExist:
            return Response({"error": "Жильё не найдено."}, status=status.HTTP_404_NOT_FOUND)

        rental = Rental.objects.create(
            house=house,
            tenant=request.user,
            start_date=datetime.strptime(start_date, "%Y-%m-%d").date(),
            end_date=datetime.strptime(end_date, "%Y-%m-%d").date(),
            status="pending"
        )

        return Response({"message": "Заявка на аренду отправлена."}, status=status.HTTP_201_CREATED)


class RentalRequestListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "landlord":
            return Response({"detail": "Только для арендодателей."}, status=403)
        
        rentals = Rental.objects.filter(house__owner=user)
        serializer = RentalRequestSerializer(rentals, many=True)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_rental(request, rental_id):
    try:
        rental = Rental.objects.get(id=rental_id)
        
        # Проверяем, является ли пользователь владельцем дома
        if rental.house.owner != request.user:
            return Response(
                {'error': 'У вас нет прав для подтверждения этой аренды'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверяем, что аренда в статусе pending
        if rental.status != 'pending':
            return Response(
                {'error': 'Можно подтвердить только ожидающие аренды'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rental.status = 'active'
        rental.is_confirmed = True
        rental.save()
        
        # Отправляем уведомление арендатору
        send_rental_confirmation_notification(rental)
        
        return Response({'message': 'Аренда успешно подтверждена'}, status=status.HTTP_200_OK)
    except Rental.DoesNotExist:
        return Response({'error': 'Аренда не найдена'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_rental(request, rental_id):
    rental = get_object_or_404(Rental, id=rental_id)
    if request.user != rental.house.owner:
        return Response({'detail': 'You do not have permission to perform this action.'}, status=status.HTTP_403_FORBIDDEN)
    rental.status = 'declined'
    rental.save()
    # Опционально: отправить уведомление арендатору
    return Response({'status': 'Rental rejected'})


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_apartment(request):
    if not request.user.email_confirmed:
        return Response(
            {"detail": "Подтвердите свою почту перед добавлением недвижимости."},
            status=status.HTTP_403_FORBIDDEN
        )
    serializer = HouseSerializer(data=request.data, context={'request': request})
    print("Полученные данные:", request.data)
    if serializer.is_valid():
        house = serializer.save()
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
    permission_classes = [AllowAny]

    def get(self, request):
        today = date.today()
        first_day = today.replace(day=1)
        last_day = today.replace(
            day=calendar.monthrange(today.year, today.month)[1]
        )

        start_date_str = request.query_params.get('start_date', first_day.strftime("%Y-%m-%d"))
        end_date_str = request.query_params.get('end_date', last_day.strftime("%Y-%m-%d"))

        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({'error': 'Неверный формат даты. Используйте YYYY-MM-DD'}, status=400)

        overlapping_rentals = Rental.objects.filter(
            status='active'
        ).filter(
            Q(start_date__lte=end_date) & Q(end_date__gte=start_date)
        ).values_list('house_id', flat=True)

        available_houses = House.objects.exclude(id__in=overlapping_rentals)

        serializer = HouseSerializer(available_houses, many=True)
        return Response(serializer.data)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_rental(request, rental_id):
    rental = get_object_or_404(Rental, id=rental_id)
    if request.user != rental.house.owner:
        return Response({'detail': 'You do not have permission to perform this action.'}, status=status.HTTP_403_FORBIDDEN)
    rental.status = 'declined'
    rental.save()
    # Опционально: отправить уведомление арендатору
    return Response({'status': 'Rental rejected'})

class AllHousesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        houses = House.objects.all()
        serializer = HouseSerializer(houses, many=True)
        return Response(serializer.data)

class FavoriteListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favorites = Favorite.objects.filter(user=request.user)
        serializer = FavoriteSerializer(favorites, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = FavoriteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
