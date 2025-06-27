"""
Middleware для централизованной обработки ошибок и логирования.
"""

import logging
import traceback
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.http import Http404
from django.core.exceptions import PermissionDenied
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler
from .exceptions import RentAppException

# Настройка логирования
logger = logging.getLogger(__name__)


class ErrorHandlingMiddleware:
    """
    Middleware для обработки исключений и логирования ошибок.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        return response
    
    def process_exception(self, request, exception):
        """
        Обрабатывает исключения, возникающие в процессе обработки запроса.
        """
        # Логируем ошибку
        self._log_error(request, exception)
        
        # Обрабатываем кастомные исключения
        if isinstance(exception, RentAppException):
            return self._handle_custom_exception(exception)
        
        # Обрабатываем стандартные Django исключения
        if isinstance(exception, Http404):
            return self._handle_404(exception)
        
        if isinstance(exception, PermissionDenied):
            return self._handle_permission_denied(exception)
        
        if isinstance(exception, ValidationError):
            return self._handle_validation_error(exception)
        
        # Обрабатываем остальные исключения
        return self._handle_generic_exception(exception)
    
    def _log_error(self, request, exception):
        """
        Логирует ошибку с контекстом запроса.
        """
        error_context = {
            'url': request.path,
            'method': request.method,
            'user': getattr(request.user, 'username', 'anonymous'),
            'user_id': getattr(request.user, 'id', None),
            'ip': self._get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        }
        
        if isinstance(exception, RentAppException):
            logger.error(
                f"Custom exception: {exception.message}",
                extra={
                    'error_code': exception.error_code,
                    'details': exception.details,
                    'context': error_context,
                    'traceback': traceback.format_exc()
                }
            )
        else:
            logger.error(
                f"Unexpected error: {str(exception)}",
                extra={
                    'exception_type': type(exception).__name__,
                    'context': error_context,
                    'traceback': traceback.format_exc()
                }
            )
    
    def _handle_custom_exception(self, exception):
        """
        Обрабатывает кастомные исключения приложения.
        """
        response_data = {
            'error': {
                'message': exception.message,
                'code': exception.error_code,
                'details': exception.details,
                'type': 'custom_exception'
            }
        }
        
        # Определяем HTTP статус на основе типа исключения
        if hasattr(exception, '__class__'):
            if 'NotFound' in exception.__class__.__name__:
                status_code = status.HTTP_404_NOT_FOUND
            elif 'Permission' in exception.__class__.__name__:
                status_code = status.HTTP_403_FORBIDDEN
            elif 'Validation' in exception.__class__.__name__:
                status_code = status.HTTP_400_BAD_REQUEST
            else:
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        else:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        
        return JsonResponse(response_data, status=status_code)
    
    def _handle_404(self, exception):
        """
        Обрабатывает ошибки 404.
        """
        response_data = {
            'error': {
                'message': 'Запрашиваемый ресурс не найден',
                'code': 'RESOURCE_NOT_FOUND',
                'type': 'not_found'
            }
        }
        return JsonResponse(response_data, status=status.HTTP_404_NOT_FOUND)
    
    def _handle_permission_denied(self, exception):
        """
        Обрабатывает ошибки доступа.
        """
        response_data = {
            'error': {
                'message': 'У вас нет прав для выполнения этой операции',
                'code': 'PERMISSION_DENIED',
                'type': 'permission_denied'
            }
        }
        return JsonResponse(response_data, status=status.HTTP_403_FORBIDDEN)
    
    def _handle_validation_error(self, exception):
        """
        Обрабатывает ошибки валидации.
        """
        response_data = {
            'error': {
                'message': 'Ошибка валидации данных',
                'code': 'VALIDATION_ERROR',
                'details': exception.message_dict if hasattr(exception, 'message_dict') else str(exception),
                'type': 'validation_error'
            }
        }
        return JsonResponse(response_data, status=status.HTTP_400_BAD_REQUEST)
    
    def _handle_generic_exception(self, exception):
        """
        Обрабатывает общие исключения.
        """
        response_data = {
            'error': {
                'message': 'Произошла внутренняя ошибка сервера',
                'code': 'INTERNAL_SERVER_ERROR',
                'type': 'server_error'
            }
        }
        
        # В продакшене не показываем детали ошибки
        if settings.DEBUG:
            response_data['error']['details'] = str(exception)
            response_data['error']['traceback'] = traceback.format_exc()
        
        return JsonResponse(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_client_ip(self, request):
        """
        Получает IP адрес клиента.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


def custom_exception_handler(exc, context):
    """
    Кастомный обработчик исключений для DRF.
    """
    # Сначала используем стандартный обработчик DRF
    response = exception_handler(exc, context)
    
    if response is not None:
        # Логируем ошибку
        request = context.get('request')
        if request:
            logger.error(
                f"DRF exception: {str(exc)}",
                extra={
                    'url': request.path,
                    'method': request.method,
                    'user': getattr(request.user, 'username', 'anonymous'),
                    'status_code': response.status_code,
                    'traceback': traceback.format_exc()
                }
            )
        
        # Форматируем ответ в едином стиле
        if isinstance(response.data, dict) and 'detail' in response.data:
            response.data = {
                'error': {
                    'message': response.data['detail'],
                    'code': 'DRF_ERROR',
                    'type': 'drf_error'
                }
            }
    
    return response 