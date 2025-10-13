"""
Защищенный доступ к файлам пользователей.

Обеспечивает контроль доступа к чувствительным файлам (документы, аватары).
Только владелец или администратор может просматривать файлы.
"""
from django.http import FileResponse, Http404, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
import os
import logging
import mimetypes

# Логгер для событий безопасности
security_logger = logging.getLogger('security')

# Импорт для Audit Trail
from rentapp.models import AuditLog, CustomUser


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def serve_protected_file(request, file_type, user_id, filename):
    """
    Защищенный доступ к файлам пользователей.
    
    Args:
        file_type: Тип файла (id_documents, avatars, evidence, dispute_evidence)
        user_id: ID пользователя-владельца файла
        filename: Имя файла
    
    Returns:
        FileResponse с файлом или 403/404 ошибка
    
    Security:
        - Пользователь может просматривать только свои файлы
        - Администраторы могут просматривать все файлы
        - Доступ к чувствительным файлам логируется
    """
    # Проверка прав: пользователь может видеть только свои файлы или админ
    if str(request.user.id) != user_id and not request.user.is_staff:
        security_logger.warning(
            f"DENIED file access | User: {request.user.username} | "
            f"Attempted: {file_type}/{user_id}/{filename}"
        )
        return HttpResponse('Forbidden: You can only access your own files', status=403)
    
    # Определяем путь к файлу в зависимости от типа
    if file_type == 'id_documents':
        file_path = os.path.join(settings.MEDIA_ROOT, 'id_documents', user_id, filename)
    elif file_type == 'avatars':
        file_path = os.path.join(settings.MEDIA_ROOT, 'avatars', user_id, filename)
    elif file_type == 'evidence':
        # Для документов жалоб
        file_path = os.path.join(settings.MEDIA_ROOT, 'evidence', user_id, filename)
    elif file_type == 'dispute_evidence':
        # Для документов споров
        file_path = os.path.join(settings.MEDIA_ROOT, 'dispute_evidence', user_id, filename)
    elif file_type == 'complaint_images':
        # Для изображений жалоб
        file_path = os.path.join(settings.MEDIA_ROOT, 'complaint_images', user_id, filename)
    else:
        security_logger.warning(
            f"INVALID file type | User: {request.user.username} | Type: {file_type}"
        )
        raise Http404('Invalid file type')
    
    # Нормализуем путь для защиты от path traversal атак
    file_path = os.path.normpath(file_path)
    media_root = os.path.normpath(settings.MEDIA_ROOT)
    
    # Проверяем что путь находится внутри MEDIA_ROOT
    if not file_path.startswith(media_root):
        security_logger.error(
            f"PATH TRAVERSAL ATTEMPT | User: {request.user.username} | Path: {file_path}"
        )
        return HttpResponse('Forbidden: Path traversal detected', status=403)
    
    # Проверяем существование файла
    if not os.path.exists(file_path):
        security_logger.info(
            f"File not found | User: {request.user.username} | Path: {file_path}"
        )
        raise Http404('File not found')
    
    # Логируем доступ к чувствительным файлам
    if file_type in ['id_documents', 'evidence', 'dispute_evidence']:
        security_logger.info(
            f"File access | User: {request.user.username} | "
            f"Owner: {user_id} | File: {file_type}/{filename}"
        )
        
        # ✅ Audit Trail: Логируем просмотр документа
        try:
            target_user = CustomUser.objects.get(id=user_id) if str(request.user.id) != user_id else request.user
            AuditLog.log_action(
                action='view_document',
                request=request,
                target_user=target_user,
                details={
                    'file_type': file_type,
                    'filename': filename,
                    'owner_id': user_id
                }
            )
        except CustomUser.DoesNotExist:
            pass
    
    # Определяем MIME-тип
    content_type, _ = mimetypes.guess_type(filename)
    if not content_type:
        content_type = 'application/octet-stream'
    
    # Возвращаем файл
    try:
        response = FileResponse(open(file_path, 'rb'), content_type=content_type)
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response
    except Exception as e:
        security_logger.error(
            f"Error serving file | User: {request.user.username} | "
            f"Path: {file_path} | Error: {str(e)}"
        )
        return HttpResponse('Internal server error', status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def serve_complaint_image(request, complaint_id, filename):
    """
    Защищенный доступ к изображениям жалоб.
    
    Проверяет что пользователь имеет отношение к жалобе (истец, ответчик или админ).
    """
    from rentapp.models import RentalComplaint
    
    try:
        complaint = RentalComplaint.objects.get(id=complaint_id)
    except RentalComplaint.DoesNotExist:
        raise Http404('Complaint not found')
    
    # Проверка прав: только участники жалобы или админ
    if (request.user != complaint.complainant and 
        request.user != complaint.accused and 
        not request.user.is_staff):
        security_logger.warning(
            f"DENIED complaint image access | User: {request.user.username} | "
            f"Complaint: {complaint_id}"
        )
        return HttpResponse('Forbidden: You are not related to this complaint', status=403)
    
    # Путь к файлу
    file_path = os.path.join(settings.MEDIA_ROOT, 'complaint_images', str(complaint_id), filename)
    
    # Нормализуем путь
    file_path = os.path.normpath(file_path)
    media_root = os.path.normpath(settings.MEDIA_ROOT)
    
    if not file_path.startswith(media_root):
        security_logger.error(
            f"PATH TRAVERSAL ATTEMPT | User: {request.user.username} | Path: {file_path}"
        )
        return HttpResponse('Forbidden: Path traversal detected', status=403)
    
    if not os.path.exists(file_path):
        raise Http404('File not found')
    
    # Логируем доступ
    security_logger.info(
        f"Complaint image access | User: {request.user.username} | "
        f"Complaint: {complaint_id} | File: {filename}"
    )
    
    # ✅ Audit Trail: Логируем просмотр изображения жалобы
    AuditLog.log_action(
        action='view_complaint',
        request=request,
        target_user=complaint.accused if complaint.accused else None,
        details={
            'complaint_id': complaint_id,
            'filename': filename
        }
    )
    
    # Определяем MIME-тип
    content_type, _ = mimetypes.guess_type(filename)
    if not content_type:
        content_type = 'application/octet-stream'
    
    # Возвращаем файл
    try:
        response = FileResponse(open(file_path, 'rb'), content_type=content_type)
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response
    except Exception as e:
        security_logger.error(
            f"Error serving complaint image | User: {request.user.username} | "
            f"Path: {file_path} | Error: {str(e)}"
        )
        return HttpResponse('Internal server error', status=500)

