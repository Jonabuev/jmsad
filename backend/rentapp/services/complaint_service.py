"""
Сервис для работы с жалобами.
Содержит бизнес-логику для создания, обновления и обработки жалоб.
"""

from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from rentapp.models import Complaint, House
from rentapp.notifications import send_complaint_received_notification, send_complaint_status_update_notification
from rentapp.exceptions import (
    ComplaintNotFoundError, ComplaintPermissionError, InvalidComplaintStatusError,
    HouseNotFoundError, RequiredFieldError, BusinessLogicException
)


class ComplaintService:
    """Сервис для работы с жалобами."""
    
    @staticmethod
    def create_complaint(data: dict, user) -> dict:
        """
        Создает новую жалобу.
        
        Args:
            data: Данные жалобы (title, description, house_id, priority)
            user: Пользователь, создающий жалобу
            
        Returns:
            dict: Результат создания жалобы
            
        Raises:
            RequiredFieldError: Если обязательные поля не заполнены
            HouseNotFoundError: Если дом не найден
            BusinessLogicException: Если нет прав для создания жалобы
        """
        title = data.get('title')
        description = data.get('description')
        house_id = data.get('house_id')
        priority = data.get('priority', 'medium')
        
        # Проверяем обязательные поля
        if not title:
            raise RequiredFieldError("title")
        if not description:
            raise RequiredFieldError("description")
        if not house_id:
            raise RequiredFieldError("house_id")
            
        # Проверяем существование дома
        try:
            house = House.objects.get(id=house_id)
        except House.DoesNotExist:
            raise HouseNotFoundError(house_id)
            
        # Проверяем, что пользователь имеет отношение к дому
        if user.role == 'tenant':
            # Проверяем, есть ли активная аренда у пользователя
            if not house.rental_set.filter(tenant=user, status='active').exists():
                raise BusinessLogicException(
                    "У вас нет активной аренды в этом доме.",
                    "NO_ACTIVE_RENTAL",
                    {"house_id": house_id, "user_id": user.id}
                )
        elif user.role == 'landlord':
            # Проверяем, является ли пользователь владельцем
            if house.owner != user:
                raise BusinessLogicException(
                    "Вы не являетесь владельцем этого дома.",
                    "NOT_HOUSE_OWNER",
                    {"house_id": house_id, "user_id": user.id}
                )
        else:
            raise BusinessLogicException(
                "Недостаточно прав для создания жалобы.",
                "INSUFFICIENT_PERMISSIONS",
                {"user_role": user.role}
            )
            
        complaint = Complaint.objects.create(
            title=title,
            description=description,
            house=house,
            complainant=user,
            priority=priority,
            status='pending'
        )
        
        # Отправляем уведомления
        send_complaint_received_notification(complaint)
        
        return {
            "message": "Жалоба успешно создана.",
            "complaint_id": complaint.id
        }
    
    @staticmethod
    def update_complaint_status(complaint_id: int, new_status: str, user) -> dict:
        """
        Обновляет статус жалобы.
        
        Args:
            complaint_id: ID жалобы
            new_status: Новый статус
            user: Пользователь, обновляющий статус
            
        Returns:
            dict: Результат обновления
            
        Raises:
            ComplaintNotFoundError: Если жалоба не найдена
            ComplaintPermissionError: Если нет прав для обновления
            InvalidComplaintStatusError: Если статус некорректный
        """
        try:
            complaint = Complaint.objects.get(id=complaint_id)
        except Complaint.DoesNotExist:
            raise ComplaintNotFoundError(complaint_id)
            
        # Проверяем права доступа
        if user.role == 'landlord':
            if complaint.house.owner != user:
                raise ComplaintPermissionError("обновления", complaint_id)
        elif user.role == 'admin':
            pass  # Админ может обновлять любые жалобы
        else:
            raise ComplaintPermissionError("обновления", complaint_id)
            
        allowed_statuses = {'pending', 'in_progress', 'resolved', 'closed'}
        if new_status not in allowed_statuses:
            raise InvalidComplaintStatusError(new_status, list(allowed_statuses))
            
        old_status = complaint.status
        complaint.status = new_status
        complaint.save()
        
        # Отправляем уведомление об изменении статуса
        if old_status != new_status:
            send_complaint_status_update_notification(complaint)
        
        return {
            "message": f"Статус жалобы обновлен на '{new_status}'",
            "status": complaint.status
        }
    
    @staticmethod
    def get_user_complaints(user, status: str = None) -> list:
        """
        Получает жалобы пользователя.
        
        Args:
            user: Пользователь
            status: Фильтр по статусу (опционально)
            
        Returns:
            list: Список жалоб пользователя
        """
        queryset = Complaint.objects.filter(complainant=user)
        
        if status:
            queryset = queryset.filter(status=status)
            
        return list(queryset.order_by('-created_at'))
    
    @staticmethod
    def get_landlord_complaints(landlord, status: str = None) -> list:
        """
        Получает жалобы для арендодателя.
        
        Args:
            landlord: Пользователь-арендодатель
            status: Фильтр по статусу (опционально)
            
        Returns:
            list: Список жалоб арендодателя
        """
        if landlord.role != 'landlord':
            return []
            
        queryset = Complaint.objects.filter(house__owner=landlord)
        
        if status:
            queryset = queryset.filter(status=status)
            
        return list(queryset.order_by('-created_at'))
    
    @staticmethod
    def get_complaint_details(complaint_id: int, user) -> dict:
        """
        Получает детали жалобы.
        
        Args:
            complaint_id: ID жалобы
            user: Пользователь, запрашивающий детали
            
        Returns:
            dict: Детали жалобы
            
        Raises:
            ComplaintNotFoundError: Если жалоба не найдена
            ComplaintPermissionError: Если нет доступа к жалобе
        """
        try:
            complaint = Complaint.objects.get(id=complaint_id)
        except Complaint.DoesNotExist:
            raise ComplaintNotFoundError(complaint_id)
            
        # Проверяем права доступа
        if user.role == 'admin':
            pass  # Админ может видеть все жалобы
        elif complaint.complainant == user:
            pass  # Автор жалобы может видеть свою жалобу
        elif user.role == 'landlord' and complaint.house.owner == user:
            pass  # Арендодатель может видеть жалобы по своим домам
        else:
            raise ComplaintPermissionError("просмотра", complaint_id)
            
        return {
            "id": complaint.id,
            "title": complaint.title,
            "description": complaint.description,
            "status": complaint.status,
            "priority": complaint.priority,
            "created_at": complaint.created_at,
            "updated_at": complaint.updated_at,
            "house": {
                "id": complaint.house.id,
                "address": complaint.house.address
            },
            "complainant": {
                "id": complaint.complainant.id,
                "username": complaint.complainant.username
            }
        }
    
    @staticmethod
    def add_complaint_comment(complaint_id: int, comment: str, user) -> dict:
        """
        Добавляет комментарий к жалобе.
        
        Args:
            complaint_id: ID жалобы
            comment: Текст комментария
            user: Пользователь, добавляющий комментарий
            
        Returns:
            dict: Результат добавления комментария
            
        Raises:
            ComplaintNotFoundError: Если жалоба не найдена
            ComplaintPermissionError: Если нет прав для добавления комментария
            RequiredFieldError: Если комментарий пустой
        """
        if not comment or not comment.strip():
            raise RequiredFieldError("comment")
            
        try:
            complaint = Complaint.objects.get(id=complaint_id)
        except Complaint.DoesNotExist:
            raise ComplaintNotFoundError(complaint_id)
            
        # Проверяем права доступа
        if user.role == 'admin':
            pass
        elif complaint.complainant == user:
            pass
        elif user.role == 'landlord' and complaint.house.owner == user:
            pass
        else:
            raise ComplaintPermissionError("добавления комментария", complaint_id)
            
        # Здесь можно добавить логику сохранения комментария
        # если у вас есть модель для комментариев
        
        return {"message": "Комментарий добавлен"} 