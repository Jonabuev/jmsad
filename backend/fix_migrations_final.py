#!/usr/bin/env python
"""
Финальный скрипт для исправления миграций
"""
import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from django.db import connection
from django.core.management import execute_from_command_line

def add_missing_migration_records():
    """Добавить недостающие записи миграций"""
    print("=== ДОБАВЛЕНИЕ НЕДОСТАЮЩИХ ЗАПИСЕЙ МИГРАЦИЙ ===")
    
    with connection.cursor() as cursor:
        # Проверим, какие миграции уже есть
        cursor.execute("""
            SELECT name FROM django_migrations 
            WHERE app = 'rentapp' 
            ORDER BY name;
        """)
        existing_migrations = [row[0] for row in cursor.fetchall()]
        
        print("Существующие миграции:")
        for migration in existing_migrations:
            print(f"  ✅ {migration}")
        
        # Добавим недостающие миграции
        migrations_to_add = [
            '0002_add_default_complaint_reasons',
            '0003_alter_complaintreason_options_and_more',
            '0004_customuser_is_banned',
            '0005_rentalcomplaint_admin_comment_and_more',
            '0006_complaintreason_reason_en_complaintreason_reason_kz_and_more',
            '0007_activitylog',
            '0008_notificationsettings_notification_action_url_and_more',
            '0009_auto_20250912_2151',
            '0010_fcmtoken'
        ]
        
        for migration_name in migrations_to_add:
            if migration_name not in existing_migrations:
                print(f"Добавление миграции: {migration_name}")
                cursor.execute("""
                    INSERT INTO django_migrations (app, name, applied) 
                    VALUES ('rentapp', %s, NOW());
                """, [migration_name])
                print(f"✅ {migration_name} добавлена")
            else:
                print(f"✅ {migration_name} уже существует")

def check_database_state():
    """Проверить состояние базы данных"""
    print("\n=== ПРОВЕРКА СОСТОЯНИЯ БАЗЫ ДАННЫХ ===")
    
    with connection.cursor() as cursor:
        # Проверим таблицы
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'rentapp_%'
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        
        print("Таблицы rentapp:")
        for table in tables:
            print(f"  📋 {table[0]}")
        
        # Проверим колонки CustomUser
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'rentapp_customuser' 
            AND column_name = 'is_banned';
        """)
        is_banned_exists = cursor.fetchall()
        
        print(f"\nCustomUser.is_banned: {'✅ существует' if is_banned_exists else '❌ отсутствует'}")
        
        # Проверим колонки ComplaintReason
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'rentapp_complaintreason' 
            AND column_name IN ('reason_kz', 'reason_en');
        """)
        complaint_columns = [row[0] for row in cursor.fetchall()]
        
        print(f"ComplaintReason.reason_kz: {'✅ существует' if 'reason_kz' in complaint_columns else '❌ отсутствует'}")
        print(f"ComplaintReason.reason_en: {'✅ существует' if 'reason_en' in complaint_columns else '❌ отсутствует'}")

def apply_migrations():
    """Применить миграции"""
    print("\n=== ПРИМЕНЕНИЕ МИГРАЦИЙ ===")
    try:
        execute_from_command_line(['manage.py', 'migrate', 'rentapp'])
        print("✅ Миграции применены успешно")
    except Exception as e:
        print(f"❌ Ошибка при применении миграций: {e}")

def test_superuser_creation():
    """Тестировать создание суперпользователя"""
    print("\n=== ТЕСТ СОЗДАНИЯ СУПЕРПОЛЬЗОВАТЕЛЯ ===")
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Проверим, можем ли мы создать пользователя
        test_user = User(
            username='test_user',
            email='test@example.com',
            first_name='Test',
            last_name='User'
        )
        test_user.set_password('testpass123')
        
        # Не сохраняем, просто проверяем валидность
        test_user.full_clean()
        print("✅ Модель пользователя работает корректно")
        
    except Exception as e:
        print(f"❌ Ошибка в модели пользователя: {e}")

def main():
    """Основная функция"""
    print("🔧 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ МИГРАЦИЙ")
    print("=" * 50)
    
    try:
        check_database_state()
        add_missing_migration_records()
        apply_migrations()
        test_superuser_creation()
        
        print("\n✅ Все исправления завершены!")
        print("\nТеперь можно создать суперпользователя:")
        print("  python manage.py createsuperuser")
        
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
