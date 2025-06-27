"""
Кастомные исключения для приложения rentapp.
Обеспечивают более детальную обработку ошибок и информативные сообщения.
"""

from django.core.exceptions import ValidationError


class RentAppException(Exception):
    """Базовое исключение для приложения rentapp."""
    
    def __init__(self, message: str, error_code: str = None, details: dict = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class RentalException(RentAppException):
    """Исключения, связанные с арендой."""
    pass


class ComplaintException(RentAppException):
    """Исключения, связанные с жалобами."""
    pass


class ForumException(RentAppException):
    """Исключения, связанные с форумом."""
    pass


class AuthenticationException(RentAppException):
    """Исключения, связанные с аутентификацией."""
    pass


class PermissionException(RentAppException):
    """Исключения, связанные с правами доступа."""
    pass


class ValidationException(RentAppException):
    """Исключения, связанные с валидацией данных."""
    pass


class NotFoundException(RentAppException):
    """Исключения, связанные с отсутствием ресурса."""
    pass


class BusinessLogicException(RentAppException):
    """Исключения, связанные с бизнес-логикой."""
    pass


# Специфичные исключения для аренды
class RentalNotFoundError(NotFoundException):
    """Аренда не найдена."""
    def __init__(self, rental_id: int):
        super().__init__(
            message=f"Аренда с ID {rental_id} не найдена",
            error_code="RENTAL_NOT_FOUND",
            details={"rental_id": rental_id}
        )


class RentalAlreadyExistsError(BusinessLogicException):
    """Аренда уже существует для указанного периода."""
    def __init__(self, house_id: int, start_date: str, end_date: str):
        super().__init__(
            message="На указанный период уже существует активная аренда",
            error_code="RENTAL_ALREADY_EXISTS",
            details={
                "house_id": house_id,
                "start_date": start_date,
                "end_date": end_date
            }
        )


class InvalidRentalDatesError(ValidationException):
    """Некорректные даты аренды."""
    def __init__(self, start_date: str, end_date: str):
        super().__init__(
            message="Дата начала должна быть раньше даты окончания",
            error_code="INVALID_RENTAL_DATES",
            details={
                "start_date": start_date,
                "end_date": end_date
            }
        )


class RentalPermissionError(PermissionException):
    """Нет прав для выполнения операции с арендой."""
    def __init__(self, operation: str, rental_id: int):
        super().__init__(
            message=f"У вас нет прав для {operation} аренды {rental_id}",
            error_code="RENTAL_PERMISSION_DENIED",
            details={
                "operation": operation,
                "rental_id": rental_id
            }
        )


# Специфичные исключения для жалоб
class ComplaintNotFoundError(NotFoundException):
    """Жалоба не найдена."""
    def __init__(self, complaint_id: int):
        super().__init__(
            message=f"Жалоба с ID {complaint_id} не найдена",
            error_code="COMPLAINT_NOT_FOUND",
            details={"complaint_id": complaint_id}
        )


class ComplaintPermissionError(PermissionException):
    """Нет прав для выполнения операции с жалобой."""
    def __init__(self, operation: str, complaint_id: int):
        super().__init__(
            message=f"У вас нет прав для {operation} жалобы {complaint_id}",
            error_code="COMPLAINT_PERMISSION_DENIED",
            details={
                "operation": operation,
                "complaint_id": complaint_id
            }
        )


class InvalidComplaintStatusError(ValidationException):
    """Некорректный статус жалобы."""
    def __init__(self, current_status: str, allowed_statuses: list):
        super().__init__(
            message=f"Недопустимый статус '{current_status}'. Разрешены: {', '.join(allowed_statuses)}",
            error_code="INVALID_COMPLAINT_STATUS",
            details={
                "current_status": current_status,
                "allowed_statuses": allowed_statuses
            }
        )


# Специфичные исключения для домов
class HouseNotFoundError(NotFoundException):
    """Дом не найден."""
    def __init__(self, house_id: int):
        super().__init__(
            message=f"Дом с ID {house_id} не найден",
            error_code="HOUSE_NOT_FOUND",
            details={"house_id": house_id}
        )


class HousePermissionError(PermissionException):
    """Нет прав для выполнения операции с домом."""
    def __init__(self, operation: str, house_id: int):
        super().__init__(
            message=f"У вас нет прав для {operation} дома {house_id}",
            error_code="HOUSE_PERMISSION_DENIED",
            details={
                "operation": operation,
                "house_id": house_id
            }
        )


# Специфичные исключения для пользователей
class UserNotFoundError(NotFoundException):
    """Пользователь не найден."""
    def __init__(self, user_id: int = None, username: str = None, email: str = None):
        identifier = user_id or username or email
        super().__init__(
            message=f"Пользователь не найден: {identifier}",
            error_code="USER_NOT_FOUND",
            details={
                "user_id": user_id,
                "username": username,
                "email": email
            }
        )


class UserPermissionError(PermissionException):
    """Нет прав для выполнения операции с пользователем."""
    def __init__(self, operation: str, user_id: int):
        super().__init__(
            message=f"У вас нет прав для {operation} пользователя {user_id}",
            error_code="USER_PERMISSION_DENIED",
            details={
                "operation": operation,
                "user_id": user_id
            }
        )


# Общие исключения
class InvalidDateFormatError(ValidationException):
    """Некорректный формат даты."""
    def __init__(self, date_string: str, expected_format: str = "YYYY-MM-DD"):
        super().__init__(
            message=f"Некорректный формат даты '{date_string}'. Ожидается: {expected_format}",
            error_code="INVALID_DATE_FORMAT",
            details={
                "date_string": date_string,
                "expected_format": expected_format
            }
        )


class RequiredFieldError(ValidationException):
    """Отсутствует обязательное поле."""
    def __init__(self, field_name: str):
        super().__init__(
            message=f"Обязательное поле '{field_name}' не заполнено",
            error_code="REQUIRED_FIELD_MISSING",
            details={"field_name": field_name}
        )


class InvalidRoleError(ValidationException):
    """Некорректная роль пользователя."""
    def __init__(self, role: str, allowed_roles: list):
        super().__init__(
            message=f"Некорректная роль '{role}'. Разрешены: {', '.join(allowed_roles)}",
            error_code="INVALID_ROLE",
            details={
                "role": role,
                "allowed_roles": allowed_roles
            }
        ) 