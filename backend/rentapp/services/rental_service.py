"""
Сервис для работы с арендой недвижимости.
Содержит бизнес-логику для создания, подтверждения и отклонения аренд.
"""

from datetime import datetime, date
import calendar
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rentapp.models import Rental, House
from rentapp.notifications import send_rental_confirmation_notification
from rentapp.exceptions import (
    RentalNotFoundError, RentalAlreadyExistsError, InvalidRentalDatesError,
    RentalPermissionError, HouseNotFoundError, InvalidDateFormatError,
    RequiredFieldError
)


class RentalService:
    """Сервис для работы с арендой недвижимости."""
    
    @staticmethod
    def create_rental_request(house_id: int, tenant, start_date: str, end_date: str) -> dict:
        """
        Создает заявку на аренду.
        
        Args:
            house_id: ID дома для аренды
            tenant: Пользователь-арендатор
            start_date: Дата начала аренды (YYYY-MM-DD)
            end_date: Дата окончания аренды (YYYY-MM-DD)
            
        Returns:
            dict: Результат создания заявки
            
        Raises:
            RequiredFieldError: Если обязательные поля не заполнены
            HouseNotFoundError: Если дом не найден
            InvalidDateFormatError: Если формат даты некорректный
            InvalidRentalDatesError: Если даты некорректные
            RentalAlreadyExistsError: Если аренда уже существует
        """
        # Проверяем обязательные поля
        if not house_id:
            raise RequiredFieldError("house_id")
        if not start_date:
            raise RequiredFieldError("start_date")
        if not end_date:
            raise RequiredFieldError("end_date")
            
        # Проверяем существование дома
        try:
            house = House.objects.get(id=house_id)
        except House.DoesNotExist:
            raise HouseNotFoundError(house_id)
            
        # Парсим даты
        try:
            start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            raise InvalidDateFormatError(start_date)
            
        # Проверяем корректность дат
        if start_date_obj >= end_date_obj:
            raise InvalidRentalDatesError(start_date, end_date)
            
        # Проверяем, нет ли уже активной аренды на этот период
        existing_rental = Rental.objects.filter(
            house=house,
            status='active'
        ).filter(
            Q(start_date__lte=end_date_obj) & Q(end_date__gte=start_date_obj)
        ).first()
        
        if existing_rental:
            raise RentalAlreadyExistsError(house_id, start_date, end_date)
            
        rental = Rental.objects.create(
            house=house,
            tenant=tenant,
            start_date=start_date_obj,
            end_date=end_date_obj,
            status="pending"
        )
        
        return {
            "message": "Заявка на аренду отправлена.",
            "rental_id": rental.id
        }
    
    @staticmethod
    def confirm_rental(rental_id: int, landlord) -> dict:
        """
        Подтверждает заявку на аренду.
        
        Args:
            rental_id: ID аренды
            landlord: Пользователь-арендодатель
            
        Returns:
            dict: Результат подтверждения
            
        Raises:
            RentalNotFoundError: Если аренда не найдена
            RentalPermissionError: Если нет прав для подтверждения
        """
        try:
            rental = Rental.objects.get(id=rental_id)
        except Rental.DoesNotExist:
            raise RentalNotFoundError(rental_id)
            
        # Проверяем, является ли пользователь владельцем дома
        if rental.house.owner != landlord:
            raise RentalPermissionError("подтверждения", rental_id)
            
        # Проверяем, что аренда в статусе pending
        if rental.status != 'pending':
            raise RentalPermissionError("подтверждения", rental_id)
            
        rental.status = 'active'
        rental.is_confirmed = True
        rental.save()
        
        # Отправляем уведомление арендатору
        send_rental_confirmation_notification(rental)
        
        return {"message": "Аренда успешно подтверждена"}
    
    @staticmethod
    def reject_rental(rental_id: int, landlord) -> dict:
        """
        Отклоняет заявку на аренду.
        
        Args:
            rental_id: ID аренды
            landlord: Пользователь-арендодатель
            
        Returns:
            dict: Результат отклонения
            
        Raises:
            RentalNotFoundError: Если аренда не найдена
            RentalPermissionError: Если нет прав для отклонения
        """
        try:
            rental = Rental.objects.get(id=rental_id)
        except Rental.DoesNotExist:
            raise RentalNotFoundError(rental_id)
            
        if landlord != rental.house.owner:
            raise RentalPermissionError("отклонения", rental_id)
            
        rental.status = 'declined'
        rental.save()
        
        return {"message": "Аренда отклонена"}
    
    @staticmethod
    def update_rental_status(rental_id: int, new_status: str, landlord) -> dict:
        """
        Обновляет статус аренды.
        
        Args:
            rental_id: ID аренды
            new_status: Новый статус
            landlord: Пользователь-арендодатель
            
        Returns:
            dict: Результат обновления
            
        Raises:
            RentalNotFoundError: Если аренда не найдена
            RentalPermissionError: Если нет прав для обновления
        """
        try:
            rental = Rental.objects.get(id=rental_id)
        except Rental.DoesNotExist:
            raise RentalNotFoundError(rental_id)
            
        # Проверяем, что арендодатель меняет статус
        if rental.house.owner != landlord:
            raise RentalPermissionError("обновления статуса", rental_id)
            
        allowed_statuses = {'active', 'declined'}
        if new_status not in allowed_statuses:
            raise RentalPermissionError("обновления статуса", rental_id)
            
        rental.status = new_status
        rental.save()
        
        return {"status": rental.status}
    
    @staticmethod
    def get_available_houses(start_date: str = None, end_date: str = None) -> list:
        """
        Получает список доступных домов.
        
        Args:
            start_date: Дата начала периода (YYYY-MM-DD)
            end_date: Дата окончания периода (YYYY-MM-DD)
            
        Returns:
            list: Список доступных домов
            
        Raises:
            InvalidDateFormatError: Если формат даты некорректный
        """
        today = date.today()
        first_day = today.replace(day=1)
        last_day = today.replace(
            day=calendar.monthrange(today.year, today.month)[1]
        )
        
        if not start_date:
            start_date = first_day.strftime("%Y-%m-%d")
        if not end_date:
            end_date = last_day.strftime("%Y-%m-%d")
            
        try:
            start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            raise InvalidDateFormatError(start_date)
            
        overlapping_rentals = Rental.objects.filter(
            status='active'
        ).filter(
            Q(start_date__lte=end_date_obj) & Q(end_date__gte=start_date_obj)
        ).values_list('house_id', flat=True)
        
        available_houses = House.objects.exclude(id__in=overlapping_rentals)
        
        return list(available_houses)
    
    @staticmethod
    def get_user_rentals(user, role: str = None) -> list:
        """
        Получает аренды пользователя в зависимости от роли.
        
        Args:
            user: Пользователь
            role: Роль пользователя (если не указана, берется из user.role)
            
        Returns:
            list: Список аренд пользователя
        """
        if role is None:
            role = user.role
            
        if role == 'tenant':
            return list(Rental.objects.filter(tenant=user, status='active'))
        elif role == 'landlord':
            return list(Rental.objects.filter(house__owner=user, status='active'))
        else:
            return []
    
    @staticmethod
    def get_landlord_rental_requests(landlord) -> list:
        """
        Получает заявки на аренду для арендодателя.
        
        Args:
            landlord: Пользователь-арендодатель
            
        Returns:
            list: Список заявок на аренду
        """
        if landlord.role != "landlord":
            return []
            
        return list(Rental.objects.filter(house__owner=landlord)) 