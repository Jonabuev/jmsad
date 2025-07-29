# views.py
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import (
    ConfirmPasswordChangeSerializer, CustomUserSerializer, IdentityVerificationSerializer, HouseSerializer, 
    HouseCreateSerializer, ComplaintCreateSerializer, ReputationSerializer, RentalSerializer
)
from .models import CustomUser, IdentityVerification, House, Complaint, Reputation, Rental
from django.core.mail import send_mail
from django.conf import settings
from django.db import IntegrityError, transaction
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Avg
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .notifications import (
    send_complaint_received_notification,
    send_complaint_status_update_notification,
    send_complaint_supported_notification,
    send_complaint_comment_notification,
    send_rental_confirmation_notification,
    send_rental_rejection_notification,
)


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken


from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import CustomUserSerializer
from .forms import CustomUserCreationForm
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .forms import CustomUserCreationForm  # Убедись, что путь правильный

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    print("Полученные данные:", request.data)

    form = CustomUserCreationForm(data=request.data)

    if form.is_valid():
        # Сохраняем пользователя (и автоматически выставляем type_identify)
        user = form.save()  # ✅ теперь сохраняется сразу

        # Генерация JWT токенов
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        profile_url = f"http://localhost:3000/profile/"

        return Response({
            "message": "Пользователь успешно зарегистрирован",
            "access_token": access_token,
            "refresh_token": str(refresh),
            "profile_url": profile_url,
        }, status=status.HTTP_201_CREATED)

    print("Ошибка в данных формы:", form.errors)
    return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import RentalComplaint
from .serializers import MyRentalSerializer
from .models import Rental, ComplaintImage

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createRentalComplaint(request):
    user = request.user
    rental_id = request.data.get('rental_id')

    # Проверка аренды
    try:
        rental = Rental.objects.get(id=rental_id)
    except Rental.DoesNotExist:
        return Response({'detail': 'Аренда не найдена.'}, status=status.HTTP_404_NOT_FOUND)

    # Проверяем, имеет ли отношение пользователь к этой аренде
    if rental.tenant != user and rental.house.owner != user:
        return Response({'detail': 'Вы не имеете доступа к этой аренде.'}, status=status.HTTP_403_FORBIDDEN)

    # Определяем обвиняемого
    accused = rental.tenant if user == rental.house.owner else rental.house.owner

    # Создаём жалобу
    new_rating = float(request.data.get('rating', 3))
    dmg = request.data.get('damage_cost') 
    complaint = RentalComplaint(
        rental=rental,
        complainant=user,
        accused=accused,
        description=request.data.get('description'),
        rating=new_rating,
        court_decision_score = dmg
        )
    
    # Получаем текущий рейтинг из модели (если его нет — считаем за 0)
    current_rating = accused.rating or 0

    # Обновляем рейтинг как среднее значение
    accused.rating = (current_rating + new_rating) / 2

    # Сохраняем изменения
    accused.save()

    if 'evidence' in request.FILES:
        complaint.evidence = request.FILES['evidence']

    complaint.save()

    # Ожидаем, что reasons — это список ID
    reasons_ids = request.data.getlist('reason')
    if reasons_ids:
        complaint.reasons.set(reasons_ids)

    # Пример: все картинки приходят под ключом 'images' как список
    images = request.FILES.getlist('evidence_images')  # ключ 'images' может быть другим, зависит от фронта
    for img in images:
       ComplaintImage.objects.create(complaint=complaint, image=img)

    # Отправляем уведомление о создании жалобы
    send_complaint_received_notification(complaint)

    return Response({'message': 'Жалоба успешно создана.', 'id': complaint.id}, status=status.HTTP_201_CREATED)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Rental
from .serializers import MyRentalSerializer

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




# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_info(request):
    user = request.user
    return Response({
        "username": user.username,
        "is_superuser": user.is_superuser,
    })


from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    # Логируем полученные данные для отладки
    print("Попытка логина с данными:", request.data)

    # Получаем данные из запроса
    username = request.data.get('username')
    password = request.data.get('password')

    # Аутентификация пользователя
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        # Пользователь прошел аутентификацию, генерируем токены
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        # Возвращаем успешный ответ с токенами
        profile_url = f"http://localhost:3000/profile/"
        return Response({
            "message": "Логин успешен",
            "access_token": access_token,
            "refresh_token": str(refresh),
            "profile_url": profile_url,
        }, status=status.HTTP_200_OK)
    else:
        # Неверные учетные данные
        return Response({
            "error": "Неверное имя пользователя или пароль"
        }, status=status.HTTP_401_UNAUTHORIZED)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Complaint

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def dispute_complaint(request, complaint_id):
    try:
        complaint = RentalComplaint.objects.get(id=complaint_id)
    except RentalComplaint.DoesNotExist:
        return Response({"error": "Жалоба не найдена"}, status=status.HTTP_404_NOT_FOUND)

    new_description = request.data.get("new_description", "")
    complaint.status = "pending"
    if new_description:
        complaint.description = new_description
    complaint.save()

    return Response({"success": "Жалоба оспорена и отправлена на повторную проверку."})




from django.db.models import Avg
from .serializers import CustomUserSerializer, RentalComplaintSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    try:
        user = request.user
        print(f"User: {user.username}, ID: {user.id}")  # Логируем пользователя

        # Убираем рейтинг (вычисление репутации и среднего рейтинга)
        # reputation = Reputation.objects.filter(tenant_identifier=user)
        # print(f"Reputation count: {reputation.count()}")  # Логируем количество рейтингов
        # average_rating = user.objects.aggregate(Avg('rating'))['rating__avg']
        # print(f"Average user rating: {average_rating}")

        # Жалобы
        complaint_send = RentalComplaint.objects.filter(accused=user)
        complaint_received = RentalComplaint.objects.filter(complainant=user)
        print(f"Sent complaints: {complaint_send.count()}, Received complaints: {complaint_received.count()}")  # Логируем количество жалоб

        # Дома (только если арендодатель)
        houses = House.objects.filter(owner=user) if user.role == "landlord" else []
        rentals_all = Rental.objects.all()


        # Аренды (только если арендатор)
        rentals = Rental.objects.filter(tenant=user) if user.role == "tenant" else []
        rental_complaints = RentalComplaint.objects.filter(
            rental__tenant=user
        ) if user.role == "tenant" else RentalComplaint.objects.filter(
            rental__house__owner=user
        )
        admin_complaints = RentalComplaint.objects.filter(status='pending')
        
        

        

        # Получаем сериализованные данные пользователя
        serialized_user = CustomUserSerializer(user).data

        data = {
            'user': serialized_user,  # Убираем средний рейтинг, так как репутация убрана
            'houses': HouseSerializer(houses, many=True).data,
            'rentals': RentalSerializer(rentals, many=True).data,
            'complaint_send': RentalComplaintSerializer(complaint_send, many=True).data,
            'complaints_rental': RentalComplaintSerializer(rental_complaints, many=True).data,
            'complaint_received': RentalComplaintSerializer(complaint_received, many=True).data,
            'admin_complaints': RentalComplaintSerializer(admin_complaints, many=True).data,
            'rentals_all':RentalSerializer(rentals_all, many=True).data
        }
        #print(f"Final response data: {data}")  # Логируем финальные данные

        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.contrib.auth.models import User
from .serializers import CustomUserSerializer

# Представление для получения профиля
@api_view(['GET'])
def profile_view(request):
    user = request.user
    serializer = CustomUserSerializer(user)
    return Response(serializer.data)

# Представление для обновления токена
class CustomTokenObtainPairView(TokenObtainPairView):
    pass
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_complaint_status(request, pk):
    try:
        complaint = Complaint.objects.get(pk=pk)
        new_status = request.data.get('status')
        if new_status not in ['pending', 'reviewed', 'rejected']:
            return Response({'error': 'Недопустимый статус'}, status=400)

        complaint.status = new_status
        complaint.save()

        return Response({'success': True, 'status': complaint.status}, status=200)

    except Complaint.DoesNotExist:
        return Response({'error': 'Жалоба не найдена'}, status=404)


from django.utils import timezone

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_complaint_status1(request, pk):
    try:
        complaint = RentalComplaint.objects.get(pk=pk)
        new_status = request.data.get('status')

        if new_status not in ['pending', 'reviewed', 'rejected']:
            return Response({'error': 'Недопустимый статус'}, status=400)

        complaint.status = new_status
        complaint.save()

        if complaint.accused_id:
          tenant = CustomUser.objects.get(id=complaint.accused_id)  # Получаем пользователя по ID
          if tenant.r_date is None:
            tenant.r_date = timezone.now()  
            tenant.save() 

        # Отправляем уведомление об изменении статуса жалобы
        send_complaint_status_update_notification(complaint)

        return Response({'success': True, 'status': complaint.status}, status=200)

    except RentalComplaint.DoesNotExist:
        return Response({'error': 'Жалоба не найдена'}, status=404)



@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_apartment(request):
    if not request.user.email_confirmed:
        return Response(
            {"detail": "Подтвердите свою почту перед добавлением недвижимости."},
            status=status.HTTP_403_FORBIDDEN
        )
    serializer = HouseCreateSerializer(data=request.data, context={'request': request})
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_apartments(request):
    houses = House.objects.filter(owner=request.user)
    return Response(HouseSerializer(houses, many=True).data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def edit_profile(request):
    user = request.user

    serializer = CustomUserSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        # Обработка удаления аватара
        if request.data.get('clear_avatar') == 'true':
            user.avatar.delete(save=False)
            user.avatar = None

        # Обработка нового аватара
        if 'avatar' in request.FILES:
            user.avatar = request.FILES['avatar']
        serializer.save()
        data = {
            'user': CustomUserSerializer(user).data,            
        }

        return Response(data, status=status.HTTP_200_OK)
    print(serializer.errors)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from .models import RentalComplaint
from .serializers import ComplaintRegistrySerializer


class TenantRegistryView(generics.ListAPIView):
    serializer_class = ComplaintRegistrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Проверка подтверждения почты
        if not user.email_confirmed:
            raise PermissionDenied("Требуется подтверждение почты для доступа.")

        # Базовый фильтр: жалобы, где арендодатель подал жалобу на арендатора
        queryset = RentalComplaint.objects.filter(
            complainant__role='landlord',
            accused__role='tenant'
        )

        # Поисковый запрос (по username и iin)
        search_query = self.request.query_params.get('search')

        if search_query:
            queryset = queryset.filter(
                Q(accused__username__icontains=search_query) |
                Q(accused__identifier__icontains=search_query)
            )
        # Фильтр по дате
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date and end_date:
            queryset = queryset.filter(created_at__range=[start_date, end_date])

        # Отладочная информация
        for complaint in queryset:
            print(f"[DEBUG] Complaint #{complaint.id}: FROM {complaint.complainant.username} ({complaint.complainant.role}) → TO {complaint.accused.username} ({complaint.accused.role})")

        return queryset



from django.db.models import Count, Q
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from .models import CustomUser
from .serializers import CustomUserSerializer

from django.db.models import Count, Q, F
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from .models import CustomUser, RentalComplaint
from .serializers import CustomUserSerializer
from datetime import datetime

from django.db.models import Count, Q, F
from django.utils import timezone
from datetime import datetime
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import ListAPIView
from django.db.models.functions import Cast
from django.db.models import CharField

class TenantRegistryView1(ListAPIView):
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if not user.email_confirmed:
            raise PermissionDenied("Требуется подтверждение почты для доступа.")

        queryset = CustomUser.objects.filter(role='tenant')

        # Фильтрация по адресу дома
        address = self.request.query_params.get('address')
        if address:
            queryset = queryset.filter(rentals__house__address__icontains=address)

        # Фильтрация по court_score и причинам — временно сохраняем для фильтрации пользователей
        court_score_filter = self.request.query_params.get('court_decision_score')
        reasons_filter = self.request.query_params.get('reasons')

        # Отдельный queryset пользователей, удовлетворяющих фильтрам по жалобам
        if court_score_filter or reasons_filter:
            # Пользователи, у которых есть жалобы с заданными court_score или reasons
            complaint_filter = Q()

            if court_score_filter:
                complaint_filter &= Q(received_rental_complaints__court_decision_score__startswith=court_score_filter)
            if reasons_filter:
                reason_ids = [int(r) for r in reasons_filter.split(',') if r.isdigit()]
                if reason_ids:
                    complaint_filter &= Q(received_rental_complaints__reasons__id__in=reason_ids)

            # Получаем пользователей с этими жалобами
            filtered_user_ids = CustomUser.objects.filter(role='tenant').filter(complaint_filter).values_list('id', flat=True).distinct()

            queryset = queryset.filter(id__in=filtered_user_ids)

        # Далее фильтрация по search и дате (если есть)
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                Q(username__icontains=search_query) |
                Q(identifier__icontains=search_query)
            )

        start_date_str = self.request.query_params.get('start_date')
        end_date_str = self.request.query_params.get('end_date')
        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
            start_date = timezone.make_aware(start_date, timezone.get_current_timezone())
            end_date = timezone.make_aware(end_date, timezone.get_current_timezone())
            queryset = queryset.filter(
                received_rental_complaints__created_at__range=[start_date, end_date]
            ).distinct()


        # Теперь аннотируем complaint_count по ВСЕМ жалобам с status='reviewed' без учета фильтров по причинам и court_score
        queryset = queryset.annotate(
            complaint_count=Count(
                'received_rental_complaints',
                filter=Q(received_rental_complaints__accused=F('id'), received_rental_complaints__status='reviewed')
            )
        ).filter(complaint_count__gt=0)  # Оставляем только с жалобами

        return queryset



class TenantRegistryView2(ListAPIView):
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if not user.email_confirmed:
            raise PermissionDenied("Требуется подтверждение почты для доступа.")

        queryset = CustomUser.objects.filter(role='landlord')

        address = self.request.query_params.get('address')
        if address:
            queryset = queryset.filter(rentals__house__address__icontains=address)

        court_score_filter = self.request.query_params.get('court_decision_score')
        reasons_filter = self.request.query_params.get('reasons')

        if court_score_filter or reasons_filter:
            complaint_filter = Q()
            if court_score_filter:
                complaint_filter &= Q(received_rental_complaints__court_decision_score__startswith=court_score_filter)
            if reasons_filter:
                reason_ids = [int(r) for r in reasons_filter.split(',') if r.isdigit()]
                if reason_ids:
                    complaint_filter &= Q(received_rental_complaints__reasons__id__in=reason_ids)

            filtered_user_ids = CustomUser.objects.filter(role='landlord').filter(complaint_filter).values_list('id', flat=True).distinct()
            queryset = queryset.filter(id__in=filtered_user_ids)

        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                Q(username__icontains=search_query) |
                Q(identifier__icontains=search_query)
            )

        start_date_str = self.request.query_params.get('start_date')
        end_date_str = self.request.query_params.get('end_date')
        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
            start_date = timezone.make_aware(start_date, timezone.get_current_timezone())
            end_date = timezone.make_aware(end_date, timezone.get_current_timezone())
            queryset = queryset.filter(
                received_rental_complaints__created_at__range=[start_date, end_date]
            ).distinct()


        queryset = queryset.annotate(
            complaint_count=Count(
                'received_rental_complaints',
                filter=Q(received_rental_complaints__accused=F('id'), received_rental_complaints__status='reviewed')
            )
        ).filter(complaint_count__gt=0)

        return queryset


from rest_framework import generics, permissions
from .models import ComplaintReason
from .serializers import ComplaintReasonSerializer


class ComplaintReasonListTenant(generics.ListAPIView):
    queryset = ComplaintReason.objects.filter(type='tenant')
    serializer_class = ComplaintReasonSerializer
    permission_classes = [permissions.IsAuthenticated]


class ComplaintReasonListLandlord(generics.ListAPIView):
    queryset = ComplaintReason.objects.filter(type='landlord')
    serializer_class = ComplaintReasonSerializer
    permission_classes = [permissions.IsAuthenticated]



# views.py
from rest_framework.generics import RetrieveAPIView
from django.shortcuts import get_object_or_404
from .models import CustomUser
from .serializers import UserProfileSerializer
from rest_framework.permissions import AllowAny
from rest_framework.generics import RetrieveAPIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import CustomUser, House, Rental, RentalComplaint
from .serializers import (
    CustomUserSerializer,
    HouseSerializer,
    RentalSerializer,
    RentalComplaintSerializer
)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import CustomUser, House, RentalComplaint, Rental
from .serializers import UserProfileSerializer

class PublicUserProfileView(APIView):
    def get(self, request, username):
        user = get_object_or_404(CustomUser, username=username)
        
        # Получение всех домов арендодателя
        houses = House.objects.filter(owner=user) if user.role == "landlord" else []

        # Получение аренд, где пользователь — арендатор
        rentals = Rental.objects.select_related("house").filter(tenant=user) if user.role == "tenant" else []

        # Жалобы, полученные этим пользователем
        complaint_received = RentalComplaint.objects.filter(accused=user)

        # Жалобы, отправленные этим пользователем
        complaints_rental = RentalComplaint.objects.filter(complainant=user)

        data = {
            "username": user.username,
            "identifier": user.identifier,
            "role": user.role,
            "rating": user.rating,
            "phone_number": user.phone_number,
            "email": user.email,
            "email_confirmed": user.email_confirmed,
            "avatar": user.avatar.url if user.avatar else None,
            "houses": [
                {
                    "id": house.id,
                    "address": house.address,
                    "type_p": house.type_p,
                    "num_of_rooms": house.num_of_rooms
                }
                for house in houses
            ],
            "rentals": [
                {
                    "id": rental.id,
                    "status": rental.status,
                    "house": {
                        "id": rental.house.id,
                        "address": rental.house.address,
                        "type_p": rental.house.type_p,
                        "num_of_rooms": rental.house.num_of_rooms
                    },
                }
                for rental in rentals
            ],
            "complaint_received": [
                {
                    "id": comp.id,
                    "description": comp.description,
                    "status": comp.status,
                    "created_at": comp.created_at,
                }
                for comp in complaint_received
            ],
            "complaints_rental": [
                {
                    "id": comp.id,
                    "description": comp.description,
                    "status": comp.status,
                    "created_at": comp.created_at,
                }
                for comp in complaints_rental
            ],
        }
        return Response(data, status=status.HTTP_200_OK)



from .serializers import ComplaintCreateSerializer

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from .models import Complaint, CustomUser, Rental
from django.db.models import Q

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_complaint(request):
    try:
        # Получаем текущего пользователя как отправителя жалобы
        complainant = request.user
        
        # Получаем обвиняемого пользователя по ИИН
        try:
            accused = CustomUser.objects.get(identifier=request.data.get('landlord_identity_iin'))
        except CustomUser.DoesNotExist:
            return Response(
                {"detail": "Пользователь с указанным ИИН не найден"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Проверяем наличие аренды между пользователями
        rental_exists = Rental.objects.filter(
            Q(house__owner=accused, tenant=complainant, status__in=['active', 'ended']) |
            Q(house__owner=complainant, tenant=accused, status__in=['active', 'ended'])
        ).exists()

        if not rental_exists:
            return Response(
                {"detail": "Вы можете подать жалобу только на пользователя, с которым у вас была аренда"},
                status=status.HTTP_403_FORBIDDEN
            )

        new_rating = float(request.data.get('rating', 3))

        complaint = Complaint(
            complainant=complainant,
            accused=accused,
            description=request.data.get('description'),
            rating=new_rating
        )

        # Получаем текущий рейтинг из модели (если его нет — считаем за 0)
        current_rating = accused.rating or 0

        # Обновляем рейтинг как среднее значение
        accused.rating = (current_rating + new_rating) / 2

        # Сохраняем изменения
        accused.save()

        # Если есть файл доказательств
        if 'evidence' in request.FILES:
            complaint.evidence = request.FILES['evidence']

        complaint.save()

        # Добавляем причины жалобы
        if 'reason' in request.data:
            complaint.reasons.set(request.data.getlist('reason'))

        return Response({
            "message": "Жалоба успешно создана",
            "id": complaint.id
        }, status=status.HTTP_201_CREATED)

    except ValidationError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {"detail": "Произошла ошибка при создании жалобы"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def house_locations(request):
    houses = House.objects.exclude(latitude=None).exclude(longitude=None)
    serializer = HouseSerializer(houses, many=True)
    return Response(serializer.data)


from .models import ComplaintReason
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def complaint_reasons(request):
    user = request.user  # Получаем аутентифицированного пользователя
    role = user.role  # Предполагаем, что role — поле модели CustomUser

    if role == "tenant":
        # Фильтруем причины жалоб на владельца (например, из БД только те, что относятся к landlord)
        reasons = ComplaintReason.objects.filter(type="landlord")  # Добавьте поле type в модель, если нужно
    elif role == "landlord":
        # Фильтруем причины жалоб на арендатора (например, из БД только те, что относятся к tenant)
        reasons = ComplaintReason.objects.filter(type="tenant")  # Добавьте поле type в модель, если нужно
    else:
        return Response({"error": "Invalid role"}, status=400)

    data = [{'id': r.id, 'reason': r.reason} for r in reasons]

    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_complaint_reasons(request):
    # Возвращаем все причины жалоб без фильтрации
    reasons = ComplaintReason.objects.all()
    data = [{'id': r.id, 'reason': r.reason} for r in reasons]

    return Response(data)

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import ComplaintCreateSerializer
from .models import Complaint

class CreateComplaintAPIView(APIView):
    def post(self, request):
        serializer = ComplaintCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    



from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import RentalComplaint, House
from .serializers import RentalComplaintSerializer
from django.db.models import Q


class ForumView(generics.ListAPIView):
    serializer_class = RentalComplaintSerializer
    permission_classes = [permissions.AllowAny]  # Allow anyone to view the forum

    def get_queryset(self):
        filter_type = self.request.query_params.get('filter', 'popular')
        region = self.request.query_params.get('region')
        city = self.request.query_params.get('city')
        district = self.request.query_params.get('district')
        address = self.request.query_params.get('address')

        qs = RentalComplaint.objects.filter(status='reviewed')

        # Apply geographic filters
        if region:
            qs = qs.filter(rental__house__region__iexact=region)
        if city:
            qs = qs.filter(rental__house__city__iexact=city)
        if district:
            qs = qs.filter(rental__house__district__iexact=district)
        
        # Apply address search
        if address:
            qs = qs.filter(rental__house__address__icontains=address)

        # Apply sorting
        if filter_type == 'new':
            return qs.order_by('-created_at')
        elif filter_type == 'old':
            return qs.order_by('created_at')
        return qs.order_by('-support_count')


@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # Allow anyone to get location filters
def get_location_filters(request):
    regions = House.objects.exclude(region__isnull=True).exclude(region__exact='').values_list('region', flat=True).distinct()
    cities = House.objects.exclude(city__isnull=True).exclude(city__exact='').values_list('city', flat=True).distinct()
    districts = House.objects.exclude(district__isnull=True).exclude(district__exact='').values_list('district', flat=True).distinct()

    return Response({
        "regions": sorted(regions),
        "cities": sorted(cities),
        "districts": sorted(districts),
    })


from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Complaint, Comment
from .serializers import CommentSerializer
class AddCommentAPIView(APIView):
    def post(self, request, complaint_id):
        
        complaint = RentalComplaint.objects.get(id=complaint_id)
        data = request.data.copy()
        data['complaint'] = complaint_id
        data['user'] = request.user.id
        serializer = CommentSerializer(data=data)
        if serializer.is_valid():
            comment = serializer.save()
            # Отправляем уведомление о новом комментарии
            send_complaint_comment_notification(complaint, comment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Complaint

class SupportComplaintAPIView(APIView):
    def post(self, request):
        complaint_id = request.data.get('complaint_id')
        complaint = RentalComplaint.objects.get(id=complaint_id)
        complaint.support_count += 1
        complaint.save()
        
        # Отправляем уведомление о поддержке жалобы
        send_complaint_supported_notification(complaint, request.user)
        
        return Response({'message': 'Complaint supported successfully'}, status=status.HTTP_200_OK)

import pandas as pd
import pickle
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Complaint, CustomUser
from .serializers import CustomUserSerializer

class RecommendTenantsAPIView(APIView):
    def get(self, request):
        # Load models
        rf_model, knn_model = self.load_models()

        # Get tenant users and complaints
        users_queryset = CustomUser.objects.filter(role='tenant')
        users_df = pd.DataFrame(list(users_queryset.values('id', 'username', 'identifier', 'role')))

        complaints_queryset = Complaint.objects.all()
        complaints_df = pd.DataFrame(list(complaints_queryset.values('tenant_identity', 'reasons')))

        if users_df.empty or complaints_df.empty:
            return Response({'error': 'No data available for tenants or complaints.'}, status=status.HTTP_404_NOT_FOUND)

        # Processing data
        complaints_count = complaints_df.groupby('tenant_identity').size().reset_index(name='complaint_count')
        df = users_df.merge(complaints_count, left_on='id', right_on='tenant_identity', how='left')
        df['complaint_count'] = df['complaint_count'].fillna(0)

        df['reliability'] = df['complaint_count'].apply(lambda x: 1 if x > 2 else 0)
        df['rf_prediction'] = df['complaint_count'].apply(lambda x: rf_model.predict([[x]])[0])
        df['knn_prediction'] = df['complaint_count'].apply(lambda x: knn_model.predict([[x]])[0])

        tenants_predictions = [
            {
                'username': row['username'],
                'complaint_count': row['complaint_count'],
                'rf_prediction': 'Unreliable' if row['rf_prediction'] else 'Reliable',
                'knn_prediction': 'Unreliable' if row['knn_prediction'] else 'Reliable',
            }
            for _, row in df.iterrows()
        ]

        return Response({'tenants_predictions': tenants_predictions})

    def load_models(self):
        with open('ML_models.pkl', 'rb') as f:
            models = pickle.load(f)
        return models['rf_model'], models['knn_model']
    
import torch
from transformers import BertTokenizer, BertForSequenceClassification
import pickle

# Загружаем модель и токенизатор
# views.py
import pickle
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import os


import os
import pandas as pd
import torch
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from transformers import BertTokenizer, BertForSequenceClassification
from torch.nn.functional import softmax

import os
import pickle
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import os
import pickle
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class RecommendTenantsAPIView(APIView):
    def load_predictions(self):
        try:
            with open(os.path.join("media", "bert_predictions.pkl"), "rb") as f:
                return pickle.load(f)
        except FileNotFoundError:
            return None
        except Exception as e:
            raise e

    def get(self, request):
        try:
            data = self.load_predictions()
            if data is None:
                return Response({"error": "Файл предсказаний не найден."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Ошибка при загрузке файла: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Формируем ответ
        result = []
        for i, text in enumerate(data.get("texts", [])):
            result.append({
                "index": i + 1,
                "description": text,
                "predicted_label": "Ненадёжный" if data["preds"][i] == 1 else "Надёжный",
                "prob_reliable": round(float(data["probs"][i][0]), 2),
                "prob_unreliable": round(float(data["probs"][i][1]), 2),
                "true_label": "Ненадёжный" if data["true_labels"][i] == 1 else "Надёжный",
            })

        return Response(result, status=status.HTTP_200_OK)

import os
import pickle
import io
import matplotlib.pyplot as plt
from sklearn.metrics import roc_curve, auc
from django.http import HttpResponse
from rest_framework.views import APIView

class ROCImageAPIView(APIView):
    def get(self, request):
        file_path = os.path.join("media", "bert_predictions.pkl")
        if not os.path.exists(file_path):
            return HttpResponse("Файл не найден", status=404)

        with open(file_path, "rb") as f:
            data = pickle.load(f)

        true_labels = data["true_labels"]
        probs = data["probs"][:, 1]  # вероятность "ненадёжного"

        # ROC
        fpr, tpr, _ = roc_curve(true_labels, probs)
        roc_auc = auc(fpr, tpr)

        # Построение графика
        plt.figure(figsize=(6, 4))
        plt.plot(fpr, tpr, color='blue', lw=2, label=f"AUC = {roc_auc:.2f}")
        plt.plot([0, 1], [0, 1], color='gray', linestyle='--')
        plt.xlabel("False Positive Rate")
        plt.ylabel("True Positive Rate")
        plt.title("ROC-кривая BERT модели")
        plt.legend(loc="lower right")
        plt.tight_layout()

        # Сохранение в память
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        plt.close()
        buf.seek(0)

        return HttpResponse(buf.read(), content_type='image/png')


import pandas as pd
import pickle
import matplotlib.pyplot as plt
import io
import base64
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Complaint, CustomUser
from django.db.models import Prefetch


@api_view(['GET'])
def evaluate_reliability(request):
    try:
        with open('rental_models1.pkl', 'rb') as f:
            models = pickle.load(f)
        rf_model = models['rf_model']
        knn_model = models['knn_model']
        logreg_model = models.get('logreg_model')
    except Exception as e:
        return Response({'error': f'Model load error: {str(e)}'}, status=500)

    COMPLAINT_WEIGHTS = {
        'Жалобы от соседей / нарушение порядка': 1,
        'Нарушение условий договора': 4,
        'Порча имущества': 3,
        'Просрочка платежей': 2,
    }

    def calculate_rating(score, count):
        if count == 0:
            return 5
        elif count == 1 and score <= 2:
            return 4
        elif count <= 2 and score <= 4:
            return 3
        elif count <= 3 or score <= 6:
            return 2
        else:
            return 1

    tenants = CustomUser.objects.filter(role='tenant', is_superuser=False)
    predictions = []

    for tenant in tenants:
        complaints = Complaint.objects.filter(tenant_identity=tenant).prefetch_related('reasons')

        all_weights = []
        for complaint in complaints:
            reasons = complaint.reasons.all()
            weights = [COMPLAINT_WEIGHTS.get(reason.reason, 0) for reason in reasons]
            all_weights.extend(weights)

        complaint_count = len(complaints)
        complaint_score = sum(all_weights)
        rating = calculate_rating(complaint_score, complaint_count)

        X = pd.DataFrame([{
            'complaint_count': complaint_count,
            'complaint_score': complaint_score,
            'rating': rating
        }])

        try:
            rf_pred = rf_model.predict(X)[0]
            knn_pred = knn_model.predict(X)[0]
            logreg_pred = logreg_model.predict(X)[0] if logreg_model else -1
        except Exception as e:
            rf_pred = knn_pred = logreg_pred = -1

        predictions.append({
            'username': tenant.username,
            'complaint_count': complaint_count,
            'complaint_score': complaint_score,
            'rating': rating,
            'rf_prediction': 'Reliable' if rf_pred == 0 else 'Unreliable',
            'knn_prediction': 'Reliable' if knn_pred == 0 else 'Unreliable',
            'logreg_prediction': 'Reliable' if logreg_pred == 0 else 'Unreliable',
        })
          # График предсказания по рейтингу на основе реальных данных
    graph_base64 = None
    if len(predictions) > 0:
        try:
            # ==== 1. Реальные данные ====
            df_real = pd.DataFrame([{
                'complaint_count': p['complaint_count'],
                'complaint_score': p['complaint_score'],
                'rating': p['rating']
            } for p in predictions])
            probs_real = logreg_model.predict_proba(df_real)[:, 1]
            df_real['prob_unreliable'] = probs_real

            avg_probs_by_rating = df_real.groupby('rating')['prob_unreliable'].mean().reset_index()

            # ==== 2. Теоретическая кривая ====
            df_theoretical = pd.DataFrame([{
                'complaint_count': 0,
                'complaint_score': 0,
                'rating': r
            } for r in range(1, 6)])
            probs_theoretical = logreg_model.predict_proba(df_theoretical)[:, 1]

            # ==== 3. Построение графика ====
            plt.figure()
            # Теоретическая кривая (линия)
            plt.plot(df_theoretical['rating'], probs_theoretical, label='LogReg кривая', linestyle='--', color='blue')
            # Реальные средние вероятности (точки)
            plt.scatter(avg_probs_by_rating['rating'], avg_probs_by_rating['prob_unreliable'], color='red', label='Средние вероятности')

            plt.title('Зависимость вероятности ненадёжности от рейтинга')
            plt.xlabel('Рейтинг')
            plt.ylabel('P(Ненадёжный)')
            plt.xticks(range(1, 6))
            plt.grid(True)
            plt.legend()

            buf = io.BytesIO()
            plt.savefig(buf, format='png')
            buf.seek(0)
            graph_base64 = base64.b64encode(buf.read()).decode('utf-8')
            buf.close()
            plt.close()
        except Exception as e:
            print("Ошибка при построении графика:", str(e))
            graph_base64 = None

    return Response({
        'tenants_predictions': predictions,
        'rating_logreg_graph': graph_base64
    })


# users/views.py
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator



CustomUser = get_user_model()
@method_decorator(csrf_exempt, name='dispatch')
class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'No token provided'}, status=400)

        # Проверка токена через Google API
        google_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        google_response = requests.get(google_url)
        if google_response.status_code != 200:
            return Response({'error': 'Invalid token'}, status=400)

        google_data = google_response.json()
        email = google_data.get('email')
        name = google_data.get('name')

        if not email:
            return Response({'error': 'Email not found in token'}, status=400)

        # Находим или создаем пользователя
        # Находим или создаем пользователя
        user, created = CustomUser.objects.get_or_create(
            email=email,
            defaults={'username': name}  # или email.split('@')[0], если хочешь
        )

        # Выдаем JWT токены
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.username,
            }
        })

from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny
from .models import Complaint
from .serializers import RentalComplaintSerializer

from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from .models import RentalComplaint
from .serializers import RentalComplaintSerializer

class ComplaintDetailByUUIDView(RetrieveAPIView):
    serializer_class = RentalComplaintSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'uuid'

    def get_queryset(self):
        user = self.request.user
        if user:
            
            print(f'{RentalComplaint.objects.all()}')
            return RentalComplaint.objects.all()



from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Rental, Favorite, ChatThread, ChatMessage, Notification
from .serializers import RentalSerializer, FavoriteSerializer, ChatThreadSerializer, ChatMessageSerializer, NotificationSerializer

# 📌 Rental API
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

# 📌 Favorite API
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

# 📌 ChatThread API
class ChatThreadListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        threads = ChatThread.objects.filter(users=request.user)
        serializer = ChatThreadSerializer(threads, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ChatThreadSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 📌 ChatMessage API
class ChatMessageListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, thread_id):
        messages = ChatMessage.objects.filter(thread_id=thread_id)
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, thread_id):
        serializer = ChatMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(sender=request.user, thread_id=thread_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 📌 Notification API
class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

class NotificationMarkAsReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(self.get_serializer(notification).data)



from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import House, Rental
from .serializers import HouseSerializer
from datetime import datetime

from datetime import datetime, date
import calendar
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q

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


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Rental, House
from datetime import datetime

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


# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Rental
from .serializers import RentalRequestSerializer

class RentalRequestListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "landlord":
            return Response({"detail": "Только для арендодателей."}, status=403)
        
        rentals = Rental.objects.filter(house__owner=user)
        serializer = RentalRequestSerializer(rentals, many=True)
        return Response(serializer.data)



from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from PIL import Image
import pytesseract
import json
import io # Импорт для обработки PDF
import pdf2image
from .serializers import ImageUploadSerializer
from .models import IdentityVerification


# Затем импортировать библиотеки
from pdf2image import convert_from_bytes


def extract_text(image):
    """Извлекает текст с изображения с помощью Tesseract"""
    try:
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        extracted_text = pytesseract.image_to_string(image, lang='eng+rus+kaz')
        return extracted_text.strip()
    except Exception as e:
        return f"Error during OCR processing: {str(e)}"


def convert_file_to_image(file):
    try:
        file_ext = file.name.lower().split(".")[-1]
        print(f"📂 Загруженный файл: {file.name}, Расширение: {file_ext}")

        if file_ext == "pdf":
            images = convert_from_bytes(file.read())
            print(f"📸 Количество извлечённых страниц: {len(images)}")

            if images:
                return images[0].convert("RGB")
            else:
                raise ValueError("Не удалось извлечь страницы из PDF")
        else:
            image = Image.open(io.BytesIO(file.read()))
            print(f"🖼 Изображение загружено: {image.format}, Размер: {image.size}")
            return image.convert("RGB") if image.mode in ("RGBA", "P") else image

    except Exception as e:
        print(f"❌ Ошибка в convert_file_to_image: {str(e)}")
        raise ValueError(f"Ошибка при обработке файла: {str(e)}")


import re
from datetime import datetime

class OCRCheckView(APIView):
    def post(self, request, *args, **kwargs):
        print("Request data:", request.data)  
        print("Uploaded files:", request.FILES)  

        serializer = ImageUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES.get('id_document')
        if not uploaded_file:
            return Response({"error": "Файл не был загружен."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            image = convert_file_to_image(uploaded_file)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        extracted_text = extract_text(image).lower()
        print("📄 Extracted text:\n", extracted_text)

        # --- Проверка на ФИО ---
        username_match = request.user.username.lower() in extracted_text
        print(f"👤 Username match: {username_match}")

        # --- Проверка на ИИН/БИН, только если не виза или виза, но с identifier ---
        identifier = request.user.identifier
        skip_identifier_check = request.user.document_type == "visa" and not identifier

        if skip_identifier_check:
            identifier_match = True
            print("ℹ️ ИИН/БИН не требуется для документа типа 'visa'")
        else:
            identifier_match = identifier and identifier in extracted_text
            print(f"🆔 Identifier match: {identifier_match}")


        # --- Проверка срока действия паспорта ---
        expiry_date_str = request.user.passport_expiry.strftime('%d.%m.%Y')
        expiry_matches = re.findall(r"\d{2}[./-]\d{2}[./-]\d{4}", extracted_text)
        expiry_match = False
        expiry_is_valid = False

        for date_str in expiry_matches:
            try:
                doc_date = datetime.strptime(date_str.replace("-", ".").replace("/", "."), '%d.%m.%Y').date()
                if doc_date == request.user.passport_expiry:
                    expiry_match = True
                if doc_date >= datetime.today().date():
                    expiry_is_valid = True
            except ValueError:
                continue

        print(f"📅 Expiry match: {expiry_match}, Not expired: {expiry_is_valid}")

        # --- Проверка визы, если используется ---
        visa_match = True
        if request.user.document_type == "visa":
            visa_number = getattr(request.user, "visa_number", "")
            if visa_number:
                visa_match = visa_number in extracted_text
                print(f"🛂 Visa number match: {visa_match}")
            else:
                print("⚠️ Виза указана, но visa_number отсутствует")

        # --- Успешная верификация ---
        if username_match and identifier_match and expiry_match and expiry_is_valid and visa_match:
            try:
                with transaction.atomic():
                    request.user.email_confirmed = True
                    request.user.save()

                    IdentityVerification.objects.create(user=request.user, id_document=uploaded_file)

                    send_mail(
                        'Verification is completed successfully.',
                        'Thank you for submitting your identity document.',
                        settings.DEFAULT_FROM_EMAIL,
                        [request.user.email],
                        fail_silently=False,
                    )

                return Response({"message": "Identity verified successfully."}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({"error": f"Ошибка при сохранении данных: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Если что-то не совпало:
        return Response({
            "error": "Документ не прошёл проверку.",
            "username_match": username_match,
            "identifier_match": identifier_match,
            "expiry_match": expiry_match,
            "expiry_valid": expiry_is_valid,
            "visa_match": visa_match,
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_identity(request):
    try:
        id_doc = request.FILES.get('id_document')
        with transaction.atomic():
            request.user.email_confirmed = True
            request.user.save()
            
            verification = IdentityVerification.objects.create(user=request.user, id_document=id_doc)
            send_mail(
                'Verification request received',
                'Thank you for submitting your identity document. We will review it shortly.',
                settings.DEFAULT_FROM_EMAIL,
                [request.user.email],
                fail_silently=False,
            )
            return Response({"message": "Identity verified successfully."}, status=status.HTTP_200_OK)
    except IntegrityError:
        return Response({"error": "Error occurred during identity verification."}, status=status.HTTP_400_BAD_REQUEST)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import PasswordChangeRequest, CustomUser  # Импортируем CustomUser
from .serializers import RequestPasswordChangeSerializer, ConfirmPasswordChangeSerializer
from .utils import generate_code, send_confirmation_code
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError


User = CustomUser

class RequestPasswordResetView(APIView):
    def post(self, request):
        email_or_username = request.data.get('email') or request.data.get('username')

        if not email_or_username:
            return Response({'error': 'Email or username is required'}, status=400)

        try:
            user = User.objects.get(email=email_or_username) if '@' in email_or_username else User.objects.get(username=email_or_username)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        code = generate_code()
        PasswordChangeRequest.objects.create(user=user, code=code)
        send_confirmation_code(user.email, code)

        return Response({'success': 'Confirmation code sent to your email'}, status=200)


class RequestPasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        code = generate_code()
        PasswordChangeRequest.objects.create(user=user, code=code)
        send_confirmation_code(user.email, code)

        return Response({'success': 'Confirmation code sent to your email'}, status=200)


# views.py

class ConfirmPasswordChangeView(APIView):
    def post(self, request):
        code = request.data.get('code')
        new_password = request.data.get('new_password')
        email = request.data.get('email')  # Добавляем email для случая сброса пароля

        if not code or not new_password:
            return Response({'error': 'Требуется код и новый пароль'}, status=400)

        try:
            if email:
                # Случай сброса пароля через email
                user = User.objects.get(email=email)
                req_obj = PasswordChangeRequest.objects.get(
                    user=user,
                    code=code,
                    is_used=False
                )
            else:
                # Случай смены пароля авторизованным пользователем
                if not request.user.is_authenticated:
                    return Response({'error': 'Требуется авторизация'}, status=401)
                req_obj = PasswordChangeRequest.objects.get(
                    user=request.user,
                    code=code,
                    is_used=False
                )
                user = request.user

        except (User.DoesNotExist, PasswordChangeRequest.DoesNotExist):
            return Response({'error': 'Неверный или использованный код'}, status=400)

        # Проверяем, не истек ли срок действия кода (10 минут)
        if req_obj.is_expired():
            return Response({'error': 'Срок действия кода истек'}, status=400)
        
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response({'error': e.messages}, status=400)


        # Меняем пароль
        user.set_password(new_password)
        user.save()

        # Помечаем код как использованный
        req_obj.is_used = True
        req_obj.save()

        return Response({'success': 'Пароль успешно изменен'}, status=200)


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

class AllHousesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        houses = House.objects.all()
        serializer = HouseSerializer(houses, many=True)
        return Response(serializer.data)



