"""
Декораторы для оптимизации производительности и кэширования.
"""

import functools
import logging
from django.core.cache import cache
from django.db import connection
from django.conf import settings
from functools import wraps
import time

logger = logging.getLogger(__name__)


def cache_result(timeout=300, key_prefix=''):
    """
    Декоратор для кэширования результатов функций.
    
    Args:
        timeout: Время жизни кэша в секундах
        key_prefix: Префикс для ключа кэша
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Генерируем ключ кэша
            cache_key = f"{key_prefix}:{func.__name__}:{hash(str(args) + str(sorted(kwargs.items())))}"
            
            # Пытаемся получить из кэша
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.info(f"Результат получен из кэша: {cache_key}")
                return cached_result
            
            # Выполняем функцию
            result = func(*args, **kwargs)
            
            # Сохраняем в кэш
            cache.set(cache_key, result, timeout)
            logger.info(f"Результат сохранен в кэш: {cache_key}")
            
            return result
        return wrapper
    return decorator


def query_optimization(func):
    """
    Декоратор для оптимизации запросов к БД.
    Логирует количество запросов и время выполнения.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        initial_queries = len(connection.queries)
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            
            # Логируем статистику
            final_queries = len(connection.queries)
            query_count = final_queries - initial_queries
            execution_time = time.time() - start_time
            
            logger.info(
                f"Функция {func.__name__}: "
                f"{query_count} запросов, "
                f"{execution_time:.3f} секунд"
            )
            
            # Предупреждение при большом количестве запросов
            if query_count > 10:
                logger.warning(
                    f"Много запросов в {func.__name__}: {query_count} запросов"
                )
            
            return result
            
        except Exception as e:
            logger.error(f"Ошибка в {func.__name__}: {e}")
            raise
    
    return wrapper


def cache_invalidate_on_change(cache_patterns):
    """
    Декоратор для инвалидации кэша при изменении данных.
    
    Args:
        cache_patterns: Список паттернов ключей кэша для инвалидации
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            
            # Инвалидируем кэш
            for pattern in cache_patterns:
                try:
                    cache.clear()
                    logger.info(f"Кэш очищен по паттерну: {pattern}")
                except Exception as e:
                    logger.error(f"Ошибка при очистке кэша: {e}")
            
            return result
        return wrapper
    return decorator


def performance_monitor(func):
    """
    Декоратор для мониторинга производительности функций.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        start_queries = len(connection.queries)
        
        try:
            result = func(*args, **kwargs)
            
            execution_time = time.time() - start_time
            query_count = len(connection.queries) - start_queries
            
            # Логируем производительность
            logger.info(
                f"Производительность {func.__name__}: "
                f"Время: {execution_time:.3f}с, "
                f"Запросы: {query_count}"
            )
            
            # Предупреждение при медленном выполнении
            if execution_time > 1.0:  # Больше 1 секунды
                logger.warning(
                    f"Медленное выполнение {func.__name__}: {execution_time:.3f}с"
                )
            
            return result
            
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(
                f"Ошибка в {func.__name__} после {execution_time:.3f}с: {e}"
            )
            raise
    
    return wrapper


def database_connection_monitor(func):
    """
    Декоратор для мониторинга соединений с БД.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        initial_connections = len(connection.queries)
        
        try:
            result = func(*args, **kwargs)
            
            final_connections = len(connection.queries)
            connection_count = final_connections - initial_connections
            
            # Логируем количество соединений
            if connection_count > 0:
                logger.info(
                    f"Соединения с БД в {func.__name__}: {connection_count}"
                )
            
            return result
            
        except Exception as e:
            logger.error(f"Ошибка БД в {func.__name__}: {e}")
            raise
    
    return wrapper


def conditional_cache(condition_func, timeout=300):
    """
    Декоратор для условного кэширования.
    
    Args:
        condition_func: Функция, возвращающая True/False для решения о кэшировании
        timeout: Время жизни кэша
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Проверяем условие кэширования
            if not condition_func(*args, **kwargs):
                return func(*args, **kwargs)
            
            # Генерируем ключ кэша
            cache_key = f"conditional:{func.__name__}:{hash(str(args) + str(sorted(kwargs.items())))}"
            
            # Пытаемся получить из кэша
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Выполняем функцию
            result = func(*args, **kwargs)
            
            # Сохраняем в кэш
            cache.set(cache_key, result, timeout)
            
            return result
        return wrapper
    return decorator


def cache_with_version(version_key, timeout=300):
    """
    Декоратор для кэширования с версионированием.
    
    Args:
        version_key: Ключ версии для инвалидации кэша
        timeout: Время жизни кэша
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Получаем текущую версию
            current_version = cache.get(version_key, 1)
            
            # Генерируем ключ кэша с версией
            cache_key = f"versioned:{func.__name__}:{current_version}:{hash(str(args) + str(sorted(kwargs.items())))}"
            
            # Пытаемся получить из кэша
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Выполняем функцию
            result = func(*args, **kwargs)
            
            # Сохраняем в кэш
            cache.set(cache_key, result, timeout)
            
            return result
        return wrapper
    return decorator


def invalidate_cache_version(version_key):
    """
    Функция для инвалидации кэша по версии.
    
    Args:
        version_key: Ключ версии для инвалидации
    """
    current_version = cache.get(version_key, 1)
    cache.set(version_key, current_version + 1)
    logger.info(f"Версия кэша обновлена: {version_key} -> {current_version + 1}")


# Утилитарные функции для работы с кэшем
def clear_cache_by_pattern(pattern):
    """
    Очищает кэш по паттерну (упрощенная версия).
    
    Args:
        pattern: Паттерн для поиска ключей
    """
    try:
        cache.clear()
        logger.info(f"Кэш очищен по паттерну: {pattern}")
    except Exception as e:
        logger.error(f"Ошибка при очистке кэша: {e}")


def get_cache_stats():
    """
    Получает статистику кэша (если доступно).
    
    Returns:
        dict: Статистика кэша
    """
    try:
        # Для LocMemCache статистика ограничена
        return {
            'backend': settings.CACHES['default']['BACKEND'],
            'timeout': settings.CACHES['default'].get('TIMEOUT', 300),
        }
    except Exception as e:
        logger.error(f"Ошибка при получении статистики кэша: {e}")
        return {} 