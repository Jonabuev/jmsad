from rentapp.permissions.document_valid import NotBlacklistedOrProfileEdit
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from django.shortcuts import get_object_or_404
from rentapp.models import BlacklistEntry, CustomUser, House, Rental, RentalComplaint, IdentityVerification, UserViolation
from rentapp.serializers import CustomUserSerializer, HouseSerializer, RentalSerializer, RentalComplaintSerializer, ComplaintRegistrySerializer
from rest_framework.views import APIView
from django.db import transaction, IntegrityError
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q, Count, F
from django.core.exceptions import PermissionDenied
from rest_framework.generics import ListAPIView
from datetime import datetime
from django.utils import timezone
from ..utils import generate_anonymous_name
from rentapp.permissions1 import IsAdmin

@api_view(['GET'])
@permission_classes([IsAuthenticated, NotBlacklistedOrProfileEdit])
def profile(request):
    """
    API endpoint для получения полного профиля пользователя.
    
    Возвращает подробную информацию о пользователе, включая:
    - Данные пользователя
    - Дома (для арендодателей)
    - Аренды (для арендаторов)
    - Жалобы (отправленные и полученные)
    - Админские жалобы (для администраторов)
    
    Permissions:
        - Требуется аутентификация
    """
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
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, NotBlacklistedOrProfileEdit])
def edit_profile(request):
    """
    API endpoint для редактирования профиля пользователя.
    
    Позволяет обновить данные пользователя, включая аватар.
    Поддерживает частичное обновление (PATCH).
    
    Supported fields:
        - Все поля модели CustomUser
        - avatar: Новый аватар
        - clear_avatar: Удаление аватара (true/false)
    
    Permissions:
        - Требуется аутентификация
        - Пользователь может редактировать только свой профиль
    """
    user = request.user

    serializer = CustomUserSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        # Обработка удаления аватара
        if request.data.get('clear_avatar') == 'true':
            user.avatar = "avatars/def.jpg"

        # Обработка нового аватара
        if 'avatar' in request.FILES:
            user.avatar = request.FILES['avatar']

        serializer.save()

        # 🔍 Проверка обновлённой даты документа
        passport_expiry = serializer.validated_data.get("passport_expiry")
        if passport_expiry and passport_expiry >= timezone.now().date():
            try:
                # Удалим из blacklist, если причина expired_document
                entry = user.blacklist
                if entry.reason == "expired_document" and not entry.manual_block:
                    entry.delete()
            except BlacklistEntry.DoesNotExist:
                pass

        data = {
            'user': CustomUserSerializer(user).data,
        }
        return Response(data, status=status.HTTP_200_OK)

    print(serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Представление для получения профиля
@api_view(['GET'])
def profile_view(request):
    """
    API endpoint для получения базовой информации о профиле.
    
    Возвращает только основные данные пользователя без дополнительной информации.
    
    Permissions:
        - Требуется аутентификация
    """
    user = request.user
    serializer = CustomUserSerializer(user)
    return Response(serializer.data)


class PublicUserProfileView(APIView):
    """
    API endpoint для получения публичного профиля пользователя.
    
    Возвращает публичную информацию о пользователе по username.
    Включает дома, аренды и жалобы пользователя.
    
    URL Parameters:
        - username: Имя пользователя для просмотра профиля
    
    Permissions:
        - Доступно всем пользователям
    """
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
            "id": user.id, 
            "username": user.username,
            "identifier": user.identifier,
            "role": user.role,
            "rating": user.rating,
            "phone_number": user.phone_number,
            "email": user.email,
            "is_banned": hasattr(user, "blacklist"),
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
                    "uuid": str(comp.uuid),
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


class IssueViolationAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        print("USER:", request.user)
        print("IS AUTH:", request.user.is_authenticated)
        print("IS SUPERUSER:", request.user.is_superuser)
        print("DATA:", request.data)

        user_id = request.data.get("user_id")
        reason = request.data.get("reason", "")

        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            print("FULL BODY:", request.data)
            return Response({"error": "Пользователь не найден"}, status=404)

        UserViolation.objects.create(
            user=user,
            issued_by=request.user,
            reason=reason
        )

        return Response({"message": "Нарушение назначено"}, status=201)


class RemoveBanAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "user_id обязателен"}, status=400)

        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response({"error": "Пользователь не найден"}, status=404)

        # Удаляем из черного списка
        removed = BlacklistEntry.objects.filter(user=user).delete()

        # Если хочешь, можно также снять все нарушения
        UserViolation.objects.filter(user=user, active=True).update(active=False)

        return Response({"message": "Блокировка снята"}, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_apartments(request):
    """
    API endpoint для получения квартир пользователя.
    
    Возвращает список всех домов/квартир, принадлежащих текущему пользователю.
    
    Permissions:
        - Требуется аутентификация
    """
    houses = House.objects.filter(owner=request.user)
    return Response(HouseSerializer(houses, many=True).data, status=status.HTTP_200_OK)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_info(request):
    """
    API endpoint для получения базовой информации о пользователе.
    
    Возвращает минимальную информацию: username и статус суперпользователя.
    
    Permissions:
        - Требуется аутентификация
    """
    user = request.user
    return Response({
        "username": user.username,
        "is_superuser": user.is_superuser,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_identity(request):
    """
    API endpoint для верификации личности пользователя.
    
    Загружает документ для верификации и помечает email как подтвержденный.
    Отправляет уведомление на email о получении документа.
    
    Required fields:
        - id_document: Файл документа для верификации
    
    Permissions:
        - Требуется аутентификация
    """
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

class TenantRegistryView(generics.ListAPIView):
    """
    API endpoint для реестра арендаторов.
    
    Возвращает список жалоб, поданных арендодателями на арендаторов.
    Поддерживает фильтрацию по поиску и датам.
    
    Query Parameters:
        - search: Поиск по username или identifier
        - start_date: Начальная дата фильтрации
        - end_date: Конечная дата фильтрации
    
    Permissions:
        - Требуется аутентификация
        - Требуется подтверждение email
    """
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



class TenantRegistryView1(ListAPIView):
    """
    API endpoint для расширенного реестра арендаторов.
    
    Возвращает список арендаторов с фильтрацией по различным критериям:
    - По адресу дома
    - По court_decision_score
    - По причинам жалоб
    - По датам
    - Поиск по username/identifier
    
    Query Parameters:
        - address: Фильтр по адресу дома
        - court_decision_score: Фильтр по court_decision_score
        - reasons: Фильтр по причинам жалоб (через запятую)
        - search: Поиск по username или identifier
        - start_date: Начальная дата
        - end_date: Конечная дата
    
    Permissions:
        - Требуется аутентификация
        - Требуется подтверждение email
    """
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
            queryset = queryset.filter(r_date__range=[start_date, end_date])

        # Теперь аннотируем complaint_count по ВСЕМ жалобам с status='reviewed' без учета фильтров по причинам и court_score
        queryset = queryset.annotate(
            complaint_count=Count(
                'received_rental_complaints',
                filter=Q(received_rental_complaints__accused=F('id'), received_rental_complaints__status='reviewed')
            )
        ).filter(complaint_count__gt=0)  # Оставляем только с жалобами

        return queryset



class TenantRegistryView2(ListAPIView):
    """
    API endpoint для реестра арендодателей.
    
    Аналогичен TenantRegistryView1, но для арендодателей.
    Возвращает список арендодателей с фильтрацией по различным критериям.
    
    Query Parameters:
        - address: Фильтр по адресу дома
        - court_decision_score: Фильтр по court_decision_score
        - reasons: Фильтр по причинам жалоб (через запятую)
        - search: Поиск по username или identifier
        - start_date: Начальная дата
        - end_date: Конечная дата
    
    Permissions:
        - Требуется аутентификация
        - Требуется подтверждение email
    """
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
            queryset = queryset.filter(r_date__range=[start_date, end_date])

        queryset = queryset.annotate(
            complaint_count=Count(
                'received_rental_complaints',
                filter=Q(received_rental_complaints__accused=F('id'), received_rental_complaints__status='reviewed')
            )
        ).filter(complaint_count__gt=0)

        return queryset
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regenerate_anonymous_name(request):
    """Генерирует новое анонимное имя для текущего пользователя"""
    try:
        user = request.user
        old_name = user.anonymous_name
        user.anonymous_name = generate_anonymous_name()
        user.save()
        
        return Response({
            'success': True,
            'anonymous_name': user.anonymous_name,
            'old_anonymous_name': old_name,
            'message': 'Анонимное имя успешно обновлено'
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_anonymous_name(request):
    """Получает текущее анонимное имя пользователя"""
    try:
        user = request.user
        return Response({
            'anonymous_name': user.anonymous_name,
            'username': user.username,
            'has_anonymous_name': bool(user.anonymous_name)
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    