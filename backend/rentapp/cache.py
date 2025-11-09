"""
Модуль для кэширования часто запрашиваемых данных.
Обеспечивает улучшение производительности за счет кэширования.
"""

import logging
from django.core.cache import cache
from django.conf import settings
from django.db.models import Q
from rentapp.models import House, RentalComplaint, ComplaintReason

logger = logging.getLogger(__name__)

# Константы для ключей кэша
CACHE_KEYS = {
    'AVAILABLE_HOUSES': 'available_houses_{start_date}_{end_date}',
    'HOUSE_LOCATIONS': 'house_locations',
    'COMPLAINT_REASONS': 'complaint_reasons_{type}',
    'FORUM_CATEGORIES': 'forum_categories',
    'LOCATION_FILTERS': 'location_filters',
    'USER_RENTALS': 'user_rentals_{user_id}_{role}',
    'USER_COMPLAINTS': 'user_complaints_{user_id}',
}

# Время жизни кэша в секундах
CACHE_TIMEOUTS = {
    'AVAILABLE_HOUSES': 300,  # 5 минут
    'HOUSE_LOCATIONS': 600,   # 10 минут
    'COMPLAINT_REASONS': 3600,  # 1 час
    'FORUM_CATEGORIES': 3600,   # 1 час
    'LOCATION_FILTERS': 1800,   # 30 минут
    'USER_RENTALS': 300,        # 5 минут
    'USER_COMPLAINTS': 300,     # 5 минут
}


class CacheManager:
    """Менеджер кэширования для приложения."""
    
    @staticmethod
    def get_cache_key(key_type: str, **kwargs) -> str:
        """
        Генерирует ключ кэша на основе типа и параметров.
        
        Args:
            key_type: Тип кэша
            **kwargs: Параметры для генерации ключа
            
        Returns:
            str: Ключ кэша
        """
        if key_type not in CACHE_KEYS:
            raise ValueError(f"Неизвестный тип кэша: {key_type}")
            
        return CACHE_KEYS[key_type].format(**kwargs)
    
    @staticmethod
    def get_cache_timeout(key_type: str) -> int:
        """
        Получает время жизни кэша для указанного типа.
        
        Args:
            key_type: Тип кэша
            
        Returns:
            int: Время жизни в секундах
        """
        return CACHE_TIMEOUTS.get(key_type, 300)
    
    @staticmethod
    def invalidate_cache_pattern(pattern: str):
        """
        Инвалидирует кэш по паттерну ключа.
        
        Args:
            pattern: Паттерн ключа для инвалидации
        """
        try:
            # В продакшене можно использовать более сложную логику
            # для инвалидации по паттерну
            cache.clear()
            logger.info(f"Кэш очищен по паттерну: {pattern}")
        except Exception as e:
            logger.error(f"Ошибка при очистке кэша: {e}")


class HouseCache:
    """Кэширование данных о домах."""
    
    @staticmethod
    def get_available_houses(start_date: str, end_date: str):
        """
        Получает доступные дома из кэша или БД.
        
        Args:
            start_date: Дата начала периода
            end_date: Дата окончания периода
            
        Returns:
            list: Список доступных домов
        """
        cache_key = CacheManager.get_cache_key(
            'AVAILABLE_HOUSES', 
            start_date=start_date, 
            end_date=end_date
        )
        
        # Пытаемся получить из кэша
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            logger.info(f"Данные получены из кэша: {cache_key}")
            return cached_data
        
        # Если нет в кэше, получаем из БД
        from rentapp.services.rental_service import RentalService
        try:
            houses = RentalService.get_available_houses(start_date, end_date)
            
            # Кэшируем результат
            timeout = CacheManager.get_cache_timeout('AVAILABLE_HOUSES')
            cache.set(cache_key, houses, timeout)
            
            logger.info(f"Данные сохранены в кэш: {cache_key}")
            return houses
        except Exception as e:
            logger.error(f"Ошибка при получении доступных домов: {e}")
            return []
    
    @staticmethod
    def get_house_locations():
        """
        Получает локации домов из кэша или БД.
        
        Returns:
            list: Список локаций домов
        """
        cache_key = CacheManager.get_cache_key('HOUSE_LOCATIONS')
        
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        try:
            houses = House.objects.select_related('owner').values(
                'id', 'address', 'latitude', 'longitude'
            )
            houses_list = list(houses)
            
            timeout = CacheManager.get_cache_timeout('HOUSE_LOCATIONS')
            cache.set(cache_key, houses_list, timeout)
            
            return houses_list
        except Exception as e:
            logger.error(f"Ошибка при получении локаций домов: {e}")
            return []
    
    @staticmethod
    def get_location_filters():
        """
        Получает фильтры по местоположению из кэша или БД.
        
        Returns:
            dict: Словарь с фильтрами
        """
        cache_key = CacheManager.get_cache_key('LOCATION_FILTERS')
        
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        try:
            regions = House.objects.exclude(
                region__isnull=True
            ).exclude(
                region__exact=''
            ).values_list('region', flat=True).distinct()
            
            cities = House.objects.exclude(
                city__isnull=True
            ).exclude(
                city__exact=''
            ).values_list('city', flat=True).distinct()
            
            districts = House.objects.exclude(
                district__isnull=True
            ).exclude(
                district__exact=''
            ).values_list('district', flat=True).distinct()
            
            filters_data = {
                "regions": sorted(regions),
                "cities": sorted(cities),
                "districts": sorted(districts),
            }
            
            timeout = CacheManager.get_cache_timeout('LOCATION_FILTERS')
            cache.set(cache_key, filters_data, timeout)
            
            return filters_data
        except Exception as e:
            logger.error(f"Ошибка при получении фильтров локации: {e}")
            return {"regions": [], "cities": [], "districts": []}


class ComplaintCache:
    """Кэширование данных о жалобах."""
    
    @staticmethod
    def get_complaint_reasons(complaint_type: str):
        """
        Получает причины жалоб из кэша или БД.
        
        Args:
            complaint_type: Тип жалобы (tenant/landlord)
            
        Returns:
            list: Список причин жалоб
        """
        cache_key = CacheManager.get_cache_key('COMPLAINT_REASONS', type=complaint_type)
        
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        try:
            reasons = ComplaintReason.objects.filter(type=complaint_type)
            reasons_list = list(reasons.values('id', 'reason'))
            
            timeout = CacheManager.get_cache_timeout('COMPLAINT_REASONS')
            cache.set(cache_key, reasons_list, timeout)
            
            return reasons_list
        except Exception as e:
            logger.error(f"Ошибка при получении причин жалоб: {e}")
            return []
    
    @staticmethod
    def get_user_complaints(user_id: int):
        """
        Получает жалобы пользователя из кэша или БД.
        
        Args:
            user_id: ID пользователя
            
        Returns:
            list: Список жалоб пользователя
        """
        cache_key = CacheManager.get_cache_key('USER_COMPLAINTS', user_id=user_id)
        
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        try:
            from rentapp.services.complaint_service import ComplaintService
            user = type('User', (), {'id': user_id})()  # Создаем mock объект
            complaints = ComplaintService.get_user_complaints(user)
            
            timeout = CacheManager.get_cache_timeout('USER_COMPLAINTS')
            cache.set(cache_key, complaints, timeout)
            
            return complaints
        except Exception as e:
            logger.error(f"Ошибка при получении жалоб пользователя: {e}")
            return []


class ForumCache:
    """Кэширование данных форума."""
    
    @staticmethod
    def get_forum_categories():
        """
        Получает категории форума из кэша или БД.
        
        Returns:
            list: Список категорий форума
        """
        cache_key = CacheManager.get_cache_key('FORUM_CATEGORIES')
        
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        try:
            from rentapp.services.forum_service import ForumService
            categories = ForumService.get_forum_categories()
            
            timeout = CacheManager.get_cache_timeout('FORUM_CATEGORIES')
            cache.set(cache_key, categories, timeout)
            
            return categories
        except Exception as e:
            logger.error(f"Ошибка при получении категорий форума: {e}")
            return []


def invalidate_house_cache():
    """Инвалидирует кэш домов."""
    CacheManager.invalidate_cache_pattern('available_houses_*')
    CacheManager.invalidate_cache_pattern('house_locations')
    CacheManager.invalidate_cache_pattern('location_filters')


def invalidate_user_cache(user_id: int):
    """Инвалидирует кэш пользователя."""
    CacheManager.invalidate_cache_pattern(f'user_rentals_{user_id}_*')
    CacheManager.invalidate_cache_pattern(f'user_complaints_{user_id}')


def invalidate_complaint_cache():
    """Инвалидирует кэш жалоб."""
    CacheManager.invalidate_cache_pattern('complaint_reasons_*') 