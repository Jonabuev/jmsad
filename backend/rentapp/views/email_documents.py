from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from ..models import EmailDocument, CustomUser, RentalComplaint, ComplaintReason
from ..permissions1 import IsAdmin
from datetime import datetime


class EmailDocumentsListView(APIView):
    """Получить список документов из email."""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        # Фильтры
        sender = request.query_params.get('sender')
        status_filter = request.query_params.get('status', 'parsed')
        
        queryset = EmailDocument.objects.all()
        
        if sender:
            queryset = queryset.filter(sender__icontains=sender)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Сериализация
        documents = []
        for doc in queryset:
            documents.append({
                'id': doc.id,
                'email_id': doc.email_id,
                'sender': doc.sender,
                'subject': doc.subject,
                'received_date': doc.received_date.isoformat(),
                'filename': doc.filename,
                'pdf_url': doc.pdf_file.url if doc.pdf_file else None,
                'parsed_data': doc.parsed_data,
                'status': doc.status,
                'error_message': doc.error_message,
                'created_at': doc.created_at.isoformat(),
            })
        
        return Response({
            'documents': documents,
            'count': len(documents)
        })


class ProcessEmailDocumentView(APIView):
    """Обработать документ из email и создать жалобу."""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def post(self, request, document_id):
        try:
            email_doc = EmailDocument.objects.get(id=document_id)
        except EmailDocument.DoesNotExist:
            return Response(
                {"error": "Документ не найден"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Получаем данные из формы
        fio = request.data.get("fio")
        birth_date = request.data.get("birth_date")
        reason_ids = request.data.get("reason_ids", [])
        court_decision_score = request.data.get("court_decision_score")
        
        if not fio or not birth_date:
            return Response(
                {"error": "fio и birth_date обязательны"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            birth_date_dt = datetime.strptime(birth_date, "%d.%m.%Y").date()
        except ValueError:
            return Response(
                {"error": "Неверный формат даты, используйте ДД.ММ.ГГГГ"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ищем или создаем пользователя
        accused_user = CustomUser.objects.filter(
            username=fio,
            birth_date__year=birth_date_dt.year
        ).first()
        
        if not accused_user:
            accused_user = CustomUser.objects.create(
                username=fio,
                birth_date=birth_date_dt,
                
                is_from_pdf=True,
                role="user",
                type_identify="iin",
            )
        
        # Создаем жалобу
        complaint = RentalComplaint.objects.create(
            complainant=request.user,
            accused=accused_user,
            description="Created by email document",
            status="reviewed",
            is_court_case=True,
            court_decision_score=court_decision_score,
            evidence=email_doc.pdf_file,  # Используем PDF из email
        )
        
        if reason_ids:
            complaint.reasons.set(ComplaintReason.objects.filter(id__in=reason_ids))
        
        # Обновляем статус документа
        email_doc.status = 'processed'
        email_doc.complaint = complaint
        email_doc.save()
        
        return Response({
            "message": "Жалоба успешно создана",
            "user_id": accused_user.id,
            "complaint_id": complaint.id,
        }, status=status.HTTP_201_CREATED)


class TriggerEmailParsingView(APIView):
    """Запустить парсинг email вручную."""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def post(self, request):
        from django.core.management import call_command
        
        sender_filter = request.data.get('sender')
        
        try:
            # Вызываем management command
            call_command('parse_emails', sender=sender_filter)
            
            return Response({
                "message": "Парсинг email запущен успешно"
            })
        except Exception as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)