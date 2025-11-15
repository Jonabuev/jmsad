from rentapp.cache import ComplaintCache, HouseCache, invalidate_complaint_cache
from rentapp.exceptions import RentAppException
from rentapp.services.complaint_service import ComplaintService
from rentapp.permissions1 import IsAdmin, IsTenantOrLandlordOrAdmin
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics, permissions, filters
from rest_framework.views import APIView
from rest_framework.generics import RetrieveAPIView
from django.db.models import Q, Prefetch
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from rentapp.models import ComplaintDispute, ComplaintSupport, House, Rental, RentalComplaint, Complaint, ComplaintReason, ComplaintImage, CustomUser, Comment
from rentapp.serializers import (
    ComplaintCreateSerializer, HouseSerializer, RentalComplaintSerializer, ComplaintReasonSerializer, CommentSerializer
)
from rentapp.notifications import (
    send_complaint_received_notification, send_complaint_status_update_notification,
    send_complaint_supported_notification, send_complaint_comment_notification
)
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.parsers import MultiPartParser, FormParser
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createRentalComplaint(request):
    user = request.user
    accused_iin = request.data.get('accused_iin')

    if not accused_iin:
        return Response({'detail': 'Не указан ИИН обвиняемого.'}, status=status.HTTP_400_BAD_REQUEST)

    accused_iin = accused_iin.strip()
    accused = CustomUser.objects.filter(identifier__iexact=accused_iin).first()

    if not accused:
        return Response({'detail': f'Пользователь с таким ИИН {accused_iin} не найден.'}, status=status.HTTP_404_NOT_FOUND)

    if accused == user:
        return Response({'detail': 'Вы не можете подать жалобу на самого себя.'}, status=status.HTTP_400_BAD_REQUEST)

    # Создаём жалобу
    complaint = RentalComplaint(
        complainant=user,
        accused=accused,
        description=request.data.get('description'),
        court_decision_score=request.data.get('court_decision_score'),  # Используем правильный ключ
        is_court_case=request.data.get('is_court_case') == "true",
    )

    if 'evidence' in request.FILES:
        complaint.evidence = request.FILES['evidence']

    complaint.save()

    # Привязываем причины
    reasons_ids = request.data.getlist('reason')
    if reasons_ids:
        complaint.reasons.set(reasons_ids)

    # Картинки
    images = request.FILES.getlist('evidence_images')
    if len(images) > 10:
        return Response({'detail': 'Максимум 10 изображений разрешено.'}, status=status.HTTP_400_BAD_REQUEST)

    for img in images:
        ComplaintImage.objects.create(complaint=complaint, image=img)

    send_complaint_received_notification(complaint)

    return Response(
        {'message': 'Жалоба успешно создана.', 'id': complaint.id},
        status=status.HTTP_201_CREATED
    )


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

        #new_rating = float(request.data.get('rating', 3))

        complaint = Complaint(
            complainant=complainant,
            accused=accused,
            description=request.data.get('description'),
            #rating=new_rating
        )

        # Получаем текущий рейтинг из модели (если его нет — считаем за 0)
        #current_rating = accused.rating or 0

        # Обновляем рейтинг как среднее значение
        #accused.rating = (current_rating + new_rating) / 2

        # Сохраняем изменения
        accused.save()

        # Если есть файл доказательств
        if 'evidence' in request.FILES:
            complaint.evidence = request.FILES['evidence']

        complaint.save()

        # Добавляем причины жалобы
        if 'reason' in request.data:
            complaint.reasons.set(request.data.getlist('reason'))

        # Логируем подачу жалобы
        try:
            from rentapp.utils import log_activity
            log_activity(
                action_type='complaint_create',
                description=f'Подана жалоба: {complainant.username} против {accused.username}. Описание: {complaint.description[:100]}...',
                user=complainant,
                target_object=complaint,
                request=request,
                metadata={
                    'complaint_id': complaint.id,
                    'complainant_id': complainant.id,
                    'accused_id': accused.id,
                    'complainant_username': complainant.username,
                    'accused_username': accused.username
                }
            )
        except Exception as e:
            print('Ошибка логирования подачи жалобы:', e)

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
@permission_classes([IsAuthenticated])
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





from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.exceptions import ValidationError

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def update_complaint(request, uuid):
    try:
        complaint = RentalComplaint.objects.get(uuid=uuid)
    except RentalComplaint.DoesNotExist:
        return Response({"error": "Жалоба не найдена"}, status=status.HTTP_404_NOT_FOUND)

    # Проверяем, что пользователь имеет право редактировать жалобу
    if complaint.complainant != request.user:
        return Response({"error": "У вас нет прав для редактирования этой жалобы"}, status=status.HTTP_403_FORBIDDEN)

    # Обновление текста
    new_description = request.data.get("description")
    if new_description is not None:
        complaint.description = new_description

    # Обновление причин
    reason_ids = request.data.getlist("reason")
    if not reason_ids:
        reason_ids = request.data.get("reason", [])
        if isinstance(reason_ids, str):
            reason_ids = reason_ids.split(",")

    if reason_ids:
        try:
            reasons = ComplaintReason.objects.filter(id__in=reason_ids)

            if len(reasons) != len(reason_ids):
                return Response({"error": "Некорректные причины"}, status=status.HTTP_400_BAD_REQUEST)

            complaint.reasons.set(reasons)
        except Exception:
            return Response({"error": "Некорректные причины"}, status=status.HTTP_400_BAD_REQUEST)


    # Обновление court_decision_score
    court_decision_score = request.data.get("court_decision_score")
    if court_decision_score is not None and complaint.is_court_case:
        complaint.court_decision_score = court_decision_score

    # Обновление основного файла (доказательства)
    if "evidence" in request.FILES and complaint.is_court_case:
        if complaint.evidence:
            complaint.evidence.delete(save=False)
        complaint.evidence = request.FILES["evidence"]

    # Обработка существующих и новых изображений
    existing_images = [url.split("/media/")[-1] for url in request.data.getlist("existing_images")]
    complaint.images.exclude(image__in=existing_images).delete()


    # Добавление новых изображений
    for img_file in request.FILES.getlist("evidence_images"):
        if complaint.images.count() + len(existing_images) >= 10:
            return Response({"error": "Максимум 10 изображений"}, status=status.HTTP_400_BAD_REQUEST)
        ComplaintImage.objects.create(complaint=complaint, image=img_file)

    # Сбрасываем статус на pending
    complaint.status = "pending"
    try:
        complaint.save()
    except ValidationError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"success": "Жалоба обновлена и отправлена на повторную проверку"}, status=status.HTTP_200_OK)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_complaint_by_uuid(request, uuid):
    try:
        complaint = RentalComplaint.objects.select_related(
            'complainant', 'accused', 'moderated_by'
        ).prefetch_related(
            'reasons', 'images'
        ).get(uuid=uuid)
    except RentalComplaint.DoesNotExist:
        return Response({"error": "Жалоба не найдена"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": "Ошибка сервера"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    serializer = RentalComplaintSerializer(complaint, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)



@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def dispute_complaintFinal(request, uuid):
    try:
        complaint = RentalComplaint.objects.get(uuid=uuid)
    except RentalComplaint.DoesNotExist:
        return Response({"error": "Жалоба не найдена"}, status=404)

    if request.user != complaint.accused:
        return Response({"error": "Вы не можете оспаривать чужую жалобу."}, status=403)

    if complaint.status != "reviewed":
        return Response({"error": "Жалобу можно оспорить только после рассмотрения."}, status=400)

    if complaint.disputes.filter(user=request.user).count() >= 2:
        return Response({"error": "Вы уже оспаривали эту жалобу 2 раза."}, status=400)

    explanation = request.data.get("explanation")
    evidence = request.FILES.get("evidence")

    if not explanation:
        return Response({"error": "Нужно указать объяснение."}, status=400)

    ComplaintDispute.objects.create(
        complaint=complaint,
        user=request.user,
        explanation=explanation,
        evidence=evidence,
    )
    complaint.status = "pending"
    complaint.save()
    return Response({"success": "Оспаривание отправлено на рассмотрение."})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
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
    """
    API endpoint для получения причин жалоб в зависимости от роли пользователя.
    Автоматически возвращает дефолтные причины для соответствующего типа.
    """
    # user = request.user
    # role = user.role

    # Убеждаемся, что дефолтные причины существуют
    ComplaintReason.ensure_default_reasons_exist()
    reasons = ComplaintReason.get.all()
    # if role == "tenant":
    #     # Арендатор может жаловаться на арендодателя
    #     reasons = ComplaintReason.get_default_reasons_for_type("landlord")
    # elif role == "landlord":
    #     # Арендодатель может жаловаться на арендатора
    #     reasons = ComplaintReason.get_default_reasons_for_type("tenant")
    # else:
    #     return Response({"error": "Invalid role"}, status=400)

    serializer = ComplaintReasonSerializer(reasons, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_complaint_reasons(request):
    """
    API endpoint для получения всех причин жалоб с поддержкой мультиязычности.
    Полезно для админ-панели или общего просмотра.
    
    Query Parameters:
        - locale: Язык (ru, kz, en). По умолчанию 'ru'.
        - type: Тип причины (tenant, landlord). Необязательный.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Убеждаемся, что дефолтные причины существуют
    ComplaintReason.ensure_default_reasons_exist()
    
    reason_type = request.GET.get('type', '')
    locale = request.GET.get('locale', 'ru')
    
    logger.info(f"Fetching complaint reasons: type={reason_type}, locale={locale}")
    
    reasons = ComplaintReason.objects.all()
    total_count = reasons.count()
    logger.info(f"Total reasons in DB: {total_count}")
    
    if reason_type:
        reasons = reasons.filter(type=reason_type)
        filtered_count = reasons.count()
        logger.info(f"Filtered reasons by type '{reason_type}': {filtered_count}")
    
    # Используем ComplaintReasonSerializer с передачей locale в контекст
    serializer = ComplaintReasonSerializer(reasons, many=True, context={'locale': locale})
    logger.info(f"Returning {len(serializer.data)} reasons for locale '{locale}'")
    
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def default_complaint_reasons(request):
    """
    API endpoint для получения только дефолтных причин жалоб.
    Возвращает причины, отсортированные по типу и порядку.
    Поддерживает мультиязычность через параметр locale.
    """
    # Убеждаемся, что дефолтные причины существуют
    ComplaintReason.ensure_default_reasons_exist()
    
    locale = request.GET.get('locale', 'ru')
    reasons = ComplaintReason.objects.filter(is_default=True)
    serializer = ComplaintReasonSerializer(reasons, many=True, context={'locale': locale})
    return Response(serializer.data)


class ComplaintReasonListTenant(generics.ListAPIView):
    queryset = ComplaintReason.objects.filter(type='tenant')
    serializer_class = ComplaintReasonSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type']
    search_fields = ['reason']
    ordering_fields = ['id', 'reason']
    
    def get_serializer_context(self):
        """Передаем locale в контекст сериализатора"""
        context = super().get_serializer_context()
        context['locale'] = self.request.GET.get('locale', 'ru')
        return context


class ComplaintReasonListLandlord(generics.ListAPIView):
    queryset = ComplaintReason.objects.filter(type='landlord')
    serializer_class = ComplaintReasonSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type']
    search_fields = ['reason']
    ordering_fields = ['id', 'reason']
    
    def get_serializer_context(self):
        """Передаем locale в контекст сериализатора"""
        context = super().get_serializer_context()
        context['locale'] = self.request.GET.get('locale', 'ru')
        return context


class ComplaintDetailListView(generics.ListAPIView):
    serializer_class = RentalComplaintSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'complainant', 'accused',]
    search_fields = ['description', 'complainant__username', 'accused__username']
    ordering_fields = ['created_at', 'support_count']

    def get_queryset(self):
        return RentalComplaint.objects.select_related(
            'complainant', 'accused'
        ).prefetch_related(
            'reasons', 'comments', 'comments__user'
        )


class ComplaintDetailByUUIDView(RetrieveAPIView):
    serializer_class = RentalComplaintSerializer
    permission_classes = [IsTenantOrLandlordOrAdmin]
    lookup_field = 'uuid'

    def get_queryset(self):
        return RentalComplaint.objects.select_related(
            'complainant', 'accused'
        ).prefetch_related(
            'reasons', 'comments', 'comments__user'
        )


class AddCommentAPIView(APIView):
    permission_classes = [IsAuthenticated]

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

        # Логируем создание комментария
        try:
            from rentapp.utils import log_activity
            log_activity(
                action_type='comment_create',
                description=f'Добавлен комментарий к жалобе #{complaint.id}. Текст: {comment_text[:100]}...',
                user=request.user,
                target_object=comment,
                request=request,
                metadata={
                    'comment_id': comment.id,
                    'complaint_id': complaint.id,
                    'comment_text': comment_text[:200]  # Ограничиваем длину для лога
                }
            )
        except Exception as e:
            print('Ошибка логирования создания комментария:', e)

        send_complaint_comment_notification(complaint, comment)

        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)





class SupportComplaintAPIView(APIView):
    permission_classes = [IsAuthenticated]

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
@permission_classes([IsTenantOrLandlordOrAdmin])
def update_complaint_status1(request, pk):
    try:
        complaint = RentalComplaint.objects.select_related('complainant', 'accused').get(pk=pk)
        new_status = request.data.get('status')
        if new_status not in ['pending', 'reviewed', 'rejected']:
            return Response({'error': 'Недопустимый статус'}, status=400)

        complaint.status = new_status
        complaint.save()

        return Response({'success': True, 'status': complaint.status}, status=200)

    except RentalComplaint.DoesNotExist:
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
    







from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from ..models import CustomUser
from ..serializers import UserSearchSerializer


@api_view(["GET"])
def search_users_by_iin(request):
    iin = request.query_params.get("iin")
    if not iin:
        return Response({"error": "iin is required"}, status=status.HTTP_400_BAD_REQUEST)

    # фильтруем пользователей, берем максимум 3
    users = CustomUser.objects.filter(identifier__icontains=iin)[:3]
    serializer = UserSearchSerializer(users, many=True)

    return Response(serializer.data, status=status.HTTP_200_OK)
