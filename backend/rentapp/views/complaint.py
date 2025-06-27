from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.generics import RetrieveAPIView
from django.db.models import Q
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from rentapp.models import House, Rental, RentalComplaint, Complaint, ComplaintReason, ComplaintImage, CustomUser, Comment
from rentapp.serializers import (
    ComplaintCreateSerializer, HouseSerializer, RentalComplaintSerializer, ComplaintReasonSerializer, CommentSerializer
)
from rentapp.notifications import (
    send_complaint_received_notification, send_complaint_status_update_notification,
    send_complaint_supported_notification, send_complaint_comment_notification
)
from django.utils import timezone
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

class ComplaintReasonListTenant(generics.ListAPIView):
    queryset = ComplaintReason.objects.filter(type='tenant')
    serializer_class = ComplaintReasonSerializer
    permission_classes = [permissions.IsAuthenticated]

class ComplaintReasonListLandlord(generics.ListAPIView):
    queryset = ComplaintReason.objects.filter(type='landlord')
    serializer_class = ComplaintReasonSerializer
    permission_classes = [permissions.IsAuthenticated]


class ComplaintDetailByUUIDView(RetrieveAPIView):
    serializer_class = RentalComplaintSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'uuid'

    def get_queryset(self):
        user = self.request.user
        if user:
            
            print(f'{RentalComplaint.objects.all()}')
            return RentalComplaint.objects.all()



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


class SupportComplaintAPIView(APIView):
    def post(self, request):
        complaint_id = request.data.get('complaint_id')
        complaint = RentalComplaint.objects.get(id=complaint_id)
        complaint.support_count += 1
        complaint.save()
        
        # Отправляем уведомление о поддержке жалобы
        send_complaint_supported_notification(complaint, request.user)
        
        return Response({'message': 'Complaint supported successfully'}, status=status.HTTP_200_OK)

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

@api_view(['GET'])
def house_locations(request):
    houses = House.objects.exclude(latitude=None).exclude(longitude=None)
    serializer = HouseSerializer(houses, many=True)
    return Response(serializer.data)

class CreateComplaintAPIView(APIView):
    def post(self, request):
        serializer = ComplaintCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    







