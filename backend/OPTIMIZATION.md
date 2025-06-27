# Оптимизация запросов и кэширование

## Обзор

Этот документ описывает реализованные оптимизации для улучшения производительности Django приложения.

## 1. Оптимизация запросов к БД

### 1.1 Select Related и Prefetch Related

Используем `select_related` и `prefetch_related` для уменьшения количества запросов к БД:

```python
# До оптимизации
rentals = Rental.objects.filter(tenant=user)

# После оптимизации
rentals = Rental.objects.select_related(
    'house', 'house__owner', 'tenant'
).filter(tenant=user)
```

### 1.2 Оптимизированные Views

#### Rental Views
- `MyRentalsAPIView`: Использует `select_related` для связанных объектов
- `RentalListCreateView`: Оптимизирован для получения всех связанных данных
- `RentalRequestListView`: Минимизирует количество запросов для заявок

#### Complaint Views
- `ComplaintDetailByUUIDView`: Использует `prefetch_related` для комментариев
- `createRentalComplaint`: Оптимизирован для получения данных аренды

#### Forum Views
- `ForumView`: Использует `select_related` и `prefetch_related` для постов
- `get_location_filters`: Кэширует фильтры по местоположению

## 2. Система кэширования

### 2.1 Архитектура кэширования

```
rentapp/
├── cache.py          # Основной модуль кэширования
├── decorators.py     # Декораторы для кэширования
└── views/
    ├── rental.py     # Views с кэшированием
    ├── complaint.py  # Views с кэшированием
    └── forum.py      # Views с кэшированием
```

### 2.2 Классы кэширования

#### CacheManager
Центральный менеджер кэширования:
- Генерация ключей кэша
- Управление временем жизни
- Инвалидация кэша

#### HouseCache
Кэширование данных о домах:
- Доступные дома
- Локации домов
- Фильтры по местоположению

#### ComplaintCache
Кэширование данных о жалобах:
- Причины жалоб
- Жалобы пользователей

#### ForumCache
Кэширование данных форума:
- Категории форума

### 2.3 Конфигурация кэширования

```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'TIMEOUT': 300,  # 5 минут по умолчанию
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
            'CULL_FREQUENCY': 3,
        }
    }
}
```

### 2.4 Время жизни кэша

| Тип данных | Время жизни | Описание |
|------------|-------------|----------|
| Доступные дома | 5 минут | Часто изменяемые данные |
| Локации домов | 10 минут | Стабильные данные |
| Причины жалоб | 1 час | Редко изменяемые данные |
| Категории форума | 1 час | Стабильные данные |
| Фильтры локации | 30 минут | Умеренно изменяемые данные |

## 3. Декораторы оптимизации

### 3.1 @cache_result
Кэширует результаты функций:

```python
@cache_result(timeout=300, key_prefix='houses')
def get_available_houses(start_date, end_date):
    # Логика получения домов
    return houses
```

### 3.2 @query_optimization
Мониторит количество запросов к БД:

```python
@query_optimization
def get_user_rentals(user):
    # Логика получения аренд
    return rentals
```

### 3.3 @performance_monitor
Отслеживает производительность функций:

```python
@performance_monitor
def create_complaint(data, user):
    # Логика создания жалобы
    return complaint
```

### 3.4 @cache_invalidate_on_change
Инвалидирует кэш при изменении данных:

```python
@cache_invalidate_on_change(['available_houses_*', 'house_locations'])
def create_house(data, user):
    # Логика создания дома
    return house
```

## 4. Мониторинг производительности

### 4.1 Логирование

Система логирует:
- Количество запросов к БД
- Время выполнения функций
- Использование кэша
- Предупреждения о медленных операциях

### 4.2 Метрики

Отслеживаемые метрики:
- Время ответа API
- Количество запросов к БД
- Hit rate кэша
- Использование памяти

## 5. Рекомендации по использованию

### 5.1 Когда использовать кэширование

✅ **Хорошо для кэширования:**
- Статичные данные (категории, причины жалоб)
- Часто запрашиваемые данные (списки домов)
- Результаты сложных вычислений
- Фильтры и справочники

❌ **Не подходит для кэширования:**
- Персональные данные пользователей
- Часто изменяемые данные
- Критически важные транзакции

### 5.2 Стратегии инвалидации

1. **По времени**: Автоматическая инвалидация через TTL
2. **По событиям**: Инвалидация при изменении данных
3. **По версии**: Версионирование кэша для принудительной инвалидации

### 5.3 Мониторинг

Регулярно проверяйте:
- Логи производительности
- Статистику кэша
- Время ответа API
- Использование ресурсов

## 6. Продакшн рекомендации

### 6.1 Redis для кэширования

Для продакшена рекомендуется использовать Redis:

```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

### 6.2 Настройки для высокой нагрузки

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}
```

### 6.3 Мониторинг в продакшене

- Используйте APM инструменты (New Relic, DataDog)
- Настройте алерты на медленные запросы
- Мониторьте использование кэша
- Отслеживайте ошибки БД

## 7. Тестирование оптимизаций

### 7.1 Unit тесты

```python
def test_cache_hit():
    # Тест попадания в кэш
    result1 = get_available_houses('2024-01-01', '2024-01-31')
    result2 = get_available_houses('2024-01-01', '2024-01-31')
    assert result1 == result2
```

### 7.2 Performance тесты

```python
def test_query_optimization():
    # Тест оптимизации запросов
    with connection.cursor() as cursor:
        initial_queries = len(connection.queries)
        get_user_rentals(user)
        final_queries = len(connection.queries)
        assert final_queries - initial_queries < 5
```

## 8. Будущие улучшения

### 8.1 Планируемые оптимизации

1. **Database indexing**: Добавление индексов для часто используемых полей
2. **Query optimization**: Дальнейшая оптимизация сложных запросов
3. **Background tasks**: Вынос тяжелых операций в фоновые задачи
4. **CDN**: Использование CDN для статических файлов

### 8.2 Мониторинг и аналитика

1. **Real-time monitoring**: Мониторинг в реальном времени
2. **Performance analytics**: Аналитика производительности
3. **Auto-scaling**: Автоматическое масштабирование
4. **Load balancing**: Балансировка нагрузки

## 9. Пагинация, фильтрация, поиск и сортировка в API

### 9.1 Пагинация

- По умолчанию используется пагинация по страницам (`PageNumberPagination`)
- Размер страницы: 10 элементов (можно изменить через параметр `page_size`)
- Пример запроса:

```
GET /api/rentals/?page=2
```

### 9.2 Фильтрация

- Фильтрация поддерживается через параметры URL.
- Примеры:
    - Получить аренды по статусу:
      ```
      GET /api/rentals/?status=active
      ```
    - Получить дома по региону и городу:
      ```
      GET /api/houses/?region=Алматы&city=Алматы
      ```
    - Получить жалобы по статусу:
      ```
      GET /api/complaints/?status=pending
      ```

### 9.3 Поиск

- Поиск осуществляется по ключевым полям (например, адрес, описание, имя пользователя)
- Используйте параметр `search`:

```
GET /api/rentals/?search=Абая
GET /api/complaints/?search=Иванов
GET /api/forum/?search=улица
```

### 9.4 Сортировка

- Сортировка по полям через параметр `ordering`:
- Примеры:
    - По дате создания (по убыванию):
      ```
      GET /api/rentals/?ordering=-created_at
      ```
    - По адресу (по возрастанию):
      ```
      GET /api/houses/?ordering=address
      ```
    - По количеству поддержек жалобы:
      ```
      GET /api/forum/?ordering=-support_count
      ```

### 9.5 Комбинирование фильтрации, поиска и сортировки

Можно комбинировать параметры:

```
GET /api/rentals/?status=active&search=Абая&ordering=-created_at&page=1
```

### 9.6 Доступные поля для фильтрации и поиска

#### Rentals
- Фильтрация: `status`, `house__address`, `house`, `tenant`
- Поиск: `house__address`, `house__region`, `house__city`
- Сортировка: `start_date`, `end_date`, `created_at`

#### Houses
- Фильтрация: `region`, `city`, `district`, `owner`
- Поиск: `address`, `region`, `city`, `district`
- Сортировка: `created_at`, `address`

#### Complaints
- Фильтрация: `status`, `complainant`, `accused`, `rental`, `type`
- Поиск: `description`, `complainant__username`, `accused__username`, `reason`
- Сортировка: `created_at`, `support_count`, `id`, `reason`

#### Forum
- Фильтрация: `status`, `rental__house__region`, `rental__house__city`, `rental__house__district`
- Поиск: `rental__house__address`, `complainant__username`, `accused__username`, `description`
- Сортировка: `created_at`, `support_count`

---

**Пример комплексного запроса:**

```
GET /api/forum/?status=reviewed&rental__house__region=Алматы&search=улица&ordering=-support_count&page=1
```

---

**Документация по фильтрации и пагинации обновлена.**

## 10. Валидация данных и защита приватных полей

### 10.1 Усиленная валидация сериализаторов

- Все сериализаторы используют ограничения `required`, `min_length`, `max_length`, `min_value`, `max_value`.
- Для вложенных сериализаторов и связанных моделей используются только нужные поля.
- В методах `create`/`update` запрещено подменять чувствительные поля (например, owner, tenant, accused и др.).
- Для файловых полей (`evidence`, `id_document`) всегда указан `required=True/False`.

**Пример:**
```python
class ComplaintCreateSerializer(serializers.Serializer):
    tenant_identity_iin = serializers.CharField(max_length=12, min_length=12, required=True)
    landlord_identity_iin = serializers.CharField(max_length=12, min_length=12, required=True)
    address = serializers.CharField(max_length=255, min_length=5, required=True)
    description = serializers.CharField(max_length=1000, min_length=10, required=True)
    rating = serializers.IntegerField(min_value=1, max_value=5, required=True)
    reason = serializers.ListField(child=serializers.IntegerField(), min_length=1, required=True)
    evidence = serializers.FileField(required=False)
```

### 10.2 Защита приватных данных

- В публичных сериализаторах (например, UserSerializer) скрыты поля `email`, `phone_number`, `is_superuser` для других пользователей.
- Приватные поля возвращаются только для текущего пользователя (`is_current_user`).
- Для моделей House, Rental, Complaint, Favorite, Chat, Notification явно перечислены только безопасные поля.
- Для сериализаторов с `fields = '__all__'` теперь используются только явные списки полей.

**Пример:**
```python
class UserSerializer(serializers.ModelSerializer):
    ...
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'role', 'avatar', 'rating', 'is_current_user']
    ...
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('is_current_user'):
            data['email'] = instance.email
            data['phone_number'] = instance.phone_number
            data['is_superuser'] = instance.is_superuser
        return data
```

### 10.3 Рекомендации

- **Никогда не возвращайте**: пароли, токены, внутренние идентификаторы, is_superuser, email, телефон — если это не профиль текущего пользователя.
- **Используйте**: ограничения на длину, required, min/max для всех пользовательских данных.
- **Проверяйте**: что пользователь не может подменить чувствительные поля через API (например, owner, tenant, accused и др.).
- **Валидация**: всегда используйте сериализаторы для валидации входных данных, не доверяйте request.data напрямую.

---

**Документация по валидации и защите приватных данных обновлена.**

## Заключение

Реализованная система оптимизации обеспечивает:

- ✅ Снижение нагрузки на БД
- ✅ Ускорение ответов API
- ✅ Улучшение пользовательского опыта
- ✅ Масштабируемость приложения
- ✅ Мониторинг производительности

Регулярно анализируйте производительность и адаптируйте оптимизации под растущие потребности приложения. 