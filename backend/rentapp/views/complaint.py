from rentapp.cache import ComplaintCache, HouseCache, invalidate_complaint_cache
from rentapp.exceptions import RentAppException
from rentapp.services.complaint_service import ComplaintService
from rentapp.permissions1 import IsLandlord, IsTenant
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics, permissions, filters
from rest_framework.views import APIView
from rest_framework.generics import RetrieveAPIView
from django.db.models import Q, Prefetch
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from rentapp.models import ComplaintSupport, House, Rental, RentalComplaint, Complaint, ComplaintReason, ComplaintImage, CustomUser, Comment
from rentapp.serializers import (
    ComplaintCreateSerializer, HouseSerializer, RentalComplaintSerializer, ComplaintReasonSerializer, CommentSerializer
)
from rentapp.notifications import (
    send_complaint_received_notification, send_complaint_status_update_notification,
    send_complaint_supported_notification, send_complaint_comment_notification
)
from django_filters.rest_framework import DjangoFilterBackend

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenant | IsLandlord])
def createRentalComplaint(request):
    user = request.user
    rental_id = request.data.get('rental_id')

    # Проверка аренды
    try:
        rental = Rental.objects.select_related('house', 'house__owner', 'tenant').get(id=rental_id)
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


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenant | IsLandlord])
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




@api_view(["POST"])
@permission_classes([IsAuthenticated, IsTenant | IsLandlord])
def dispute_complaint(request, complaint_id):
    try:
        complaint = RentalComplaint.objects.select_related('rental', 'complainant', 'accused').get(id=complaint_id)
    except RentalComplaint.DoesNotExist:
        return Response({"error": "Жалоба не найдена"}, status=status.HTTP_404_NOT_FOUND)

    new_description = request.data.get("new_description", "")
    complaint.status = "pending"
    if new_description:
        complaint.description = new_description
    complaint.save()

    return Response({"success": "Жалоба оспорена и отправлена на повторную проверку."})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsLandlord])
def update_complaint_status(request, pk):
    try:
        result = ComplaintService.update_complaint_status(pk, request.data.get('status'), request.user)
        # Инвалидируем кэш жалоб после обновления статуса
        invalidate_complaint_cache()
        return Response(result, status=status.HTTP_200_OK)
    except RentAppException as e:
        return Response({'error': e.message}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def complaint_reasons(request):
    user = request.user  # Получаем аутентифицированного пользователя
    role = user.role  # Предполагаем, что role — поле модели CustomUser

    if role == "tenant":
        # Используем кэширование для причин жалоб
        reasons = ComplaintCache.get_complaint_reasons("landlord")
    elif role == "landlord":
        # Используем кэширование для причин жалоб
        reasons = ComplaintCache.get_complaint_reasons("tenant")
    else:
        return Response({"error": "Invalid role"}, status=400)

    return Response(reasons)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_complaint_reasons(request):
    # Возвращаем все причины жалоб без фильтрации
    reasons = ComplaintReason.objects.all()
    serializer = ComplaintReasonSerializer(reasons, many=True)
    return Response(serializer.data)


class ComplaintReasonListTenant(generics.ListAPIView):
    queryset = ComplaintReason.objects.filter(type='tenant')
    serializer_class = ComplaintReasonSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenant]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type']
    search_fields = ['reason']
    ordering_fields = ['id', 'reason']


class ComplaintReasonListLandlord(generics.ListAPIView):
    queryset = ComplaintReason.objects.filter(type='landlord')
    serializer_class = ComplaintReasonSerializer
    permission_classes = [permissions.IsAuthenticated, IsLandlord]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type']
    search_fields = ['reason']
    ordering_fields = ['id', 'reason']


class ComplaintDetailListView(generics.ListAPIView):
    serializer_class = RentalComplaintSerializer
    permission_classes = [IsAuthenticated, IsTenant | IsLandlord]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'complainant', 'accused', 'rental']
    search_fields = ['description', 'complainant__username', 'accused__username']
    ordering_fields = ['created_at', 'support_count']

    def get_queryset(self):
        return RentalComplaint.objects.select_related(
            'rental', 'rental__house', 'rental__house__owner',
            'complainant', 'accused'
        ).prefetch_related(
            'reasons', 'comments', 'comments__user'
        )


class ComplaintDetailByUUIDView(RetrieveAPIView):
    serializer_class = RentalComplaintSerializer
    permission_classes = [IsAuthenticated, IsTenant | IsLandlord]
    lookup_field = 'uuid'

    def get_queryset(self):
        return RentalComplaint.objects.select_related(
            'rental', 'rental__house', 'rental__house__owner',
            'complainant', 'accused'
        ).prefetch_related(
            'reasons', 'comments', 'comments__user'
        )


class AddCommentAPIView(APIView):
    permission_classes = [IsAuthenticated, IsTenant | IsLandlord]

    def post(self, request, complaint_id):
        try:
            complaint = RentalComplaint.objects.select_related('rental', 'complainant').get(id=complaint_id)
        except RentalComplaint.DoesNotExist:
            return Response({"error": "Жалоба не найдена"}, status=status.HTTP_404_NOT_FOUND)

        # Проверка лимита: максимум 2 комментария от пользователя на жалобу
        existing_comments = Comment.objects.filter(complaint=complaint, user=request.user).count()
        if existing_comments >= 2:
            return Response({"error": "Вы можете оставить не более 2 комментариев к одной жалобе"}, status=status.HTTP_403_FORBIDDEN)

        comment_text = request.data.get('text')
        if not comment_text:
            return Response({"error": "Текст комментария обязателен"}, status=status.HTTP_400_BAD_REQUEST)

        comment = Comment.objects.create(
            complaint=complaint,
            user=request.user,
            text=comment_text
        )

        send_complaint_comment_notification(complaint, comment)

        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)





class SupportComplaintAPIView(APIView):
    permission_classes = [IsAuthenticated, IsTenant | IsLandlord]

    def post(self, request):
        complaint_id = request.data.get('complaint_id')
        try:
            complaint = RentalComplaint.objects.get(id=complaint_id)
        except RentalComplaint.DoesNotExist:
            return Response({"error": "Жалоба не найдена"}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        support = ComplaintSupport.objects.filter(user=user, complaint=complaint).first()

        if support:
            # Пользователь уже поддержал — отменяем
            support.delete()
            complaint.support_count = max(0, complaint.support_count - 1)
            complaint.save()
            return Response({"message": "Поддержка жалобы отменена"}, status=status.HTTP_200_OK)
        else:
            # Пользователь не поддерживал — поддерживаем
            ComplaintSupport.objects.create(user=user, complaint=complaint)
            complaint.support_count += 1
            complaint.save()
            send_complaint_supported_notification(complaint, user)
            return Response({"message": "Жалоба поддержана"}, status=status.HTTP_200_OK)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_complaint_status1(request, pk):
    try:
        complaint = Complaint.objects.select_related('complainant', 'accused').get(pk=pk)
        new_status = request.data.get('status')
        if new_status not in ['pending', 'reviewed', 'rejected']:
            return Response({'error': 'Недопустимый статус'}, status=400)

        complaint.status = new_status
        complaint.save()

        return Response({'success': True, 'status': complaint.status}, status=200)

    except Complaint.DoesNotExist:
        return Response({'error': 'Жалоба не найдена'}, status=404)


@api_view(['GET'])
def house_locations(request):
    # Используем кэширование для локаций домов
    houses = HouseCache.get_house_locations()
    return Response(houses)


class CreateComplaintAPIView(APIView):
    """
    API endpoint для создания жалобы.
    
    POST: Создает новую жалобу
    
    Required fields:
        - title: Заголовок жалобы
        - description: Описание жалобы
        - house_id: ID дома
        - priority: Приоритет жалобы (опционально)
    
    Permissions:
        - Требуется аутентификация
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            result = ComplaintService.create_complaint(request.data, request.user)
            return Response(result, status=status.HTTP_201_CREATED)
        except RentAppException as e:
            return Response({"error": e.message}, status=status.HTTP_400_BAD_REQUEST)
    







