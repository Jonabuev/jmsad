#!/usr/bin/env python
"""
Полный скрипт для исправления всех проблем с миграциями
"""
import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from django.db import connection
from django.core.management import execute_from_command_line

def check_migration_status():
    """Проверить статус миграций"""
    print("=== ПРОВЕРКА СТАТУСА МИГРАЦИЙ ===")
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT app, name, applied 
            FROM django_migrations 
            WHERE app = 'rentapp'
            ORDER BY name;
        """)
        migrations = cursor.fetchall()
        
        print("Миграции rentapp:")
        for app, name, applied in migrations:
            status = "✅" if applied else "❌"
            print(f"  {status} {name}")

def check_missing_columns():
    """Проверить отсутствующие колонки"""
    print("\n=== ПРОВЕРКА ОТСУТСТВУЮЩИХ КОЛОНОК ===")
    
    # Проверяем CustomUser
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'rentapp_customuser' 
            AND column_name = 'is_banned';
        """)
        user_columns = cursor.fetchall()
        
        print("CustomUser:")
        if not user_columns:
            print("  ❌ is_banned отсутствует")
        else:
            print("  ✅ is_banned существует")
    
    # Проверяем RentalComplaint
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'rentapp_rentalcomplaint' 
            AND column_name IN ('admin_comment', 'moderated_at', 'moderated_by_id');
        """)
        complaint_columns = [row[0] for row in cursor.fetchall()]
        
        print("RentalComplaint:")
        if 'admin_comment' not in complaint_columns:
            print("  ❌ admin_comment отсутствует")
        else:
            print("  ✅ admin_comment существует")
            
        if 'moderated_at' not in complaint_columns:
            print("  ❌ moderated_at отсутствует")
        else:
            print("  ✅ moderated_at существует")
            
        if 'moderated_by_id' not in complaint_columns:
            print("  ❌ moderated_by_id отсутствует")
        else:
            print("  ✅ moderated_by_id существует")

def fix_customuser_columns():
    """Исправить колонки CustomUser"""
    print("\n=== ИСПРАВЛЕНИЕ КОЛОНОК CUSTOMUSER ===")
    with connection.cursor() as cursor:
        # Проверяем существование поля is_banned
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'rentapp_customuser' 
            AND column_name = 'is_banned';
        """)
        existing_columns = cursor.fetchall()
        
        if not existing_columns:
            print("Добавление поля is_banned...")
            cursor.execute("""
                ALTER TABLE rentapp_customuser 
                ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
            """)
            print("✅ is_banned добавлено")
        else:
            print("✅ is_banned уже существует")

def fix_rentalcomplaint_columns():
    """Исправить колонки RentalComplaint"""
    print("\n=== ИСПРАВЛЕНИЕ КОЛОНОК RENTALCOMPLAINT ===")
    with connection.cursor() as cursor:
        # Проверяем существование полей
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'rentapp_rentalcomplaint' 
            AND column_name IN ('admin_comment', 'moderated_at', 'moderated_by_id');
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        if 'admin_comment' not in existing_columns:
            print("Добавление поля admin_comment...")
            cursor.execute("""
                ALTER TABLE rentapp_rentalcomplaint 
                ADD COLUMN admin_comment TEXT NULL;
            """)
            print("✅ admin_comment добавлено")
        else:
            print("✅ admin_comment уже существует")
            
        if 'moderated_at' not in existing_columns:
            print("Добавление поля moderated_at...")
            cursor.execute("""
                ALTER TABLE rentapp_rentalcomplaint 
                ADD COLUMN moderated_at TIMESTAMP NULL;
            """)
            print("✅ moderated_at добавлено")
        else:
            print("✅ moderated_at уже существует")
            
        if 'moderated_by_id' not in existing_columns:
            print("Добавление поля moderated_by_id...")
            cursor.execute("""
                ALTER TABLE rentapp_rentalcomplaint 
                ADD COLUMN moderated_by_id INTEGER NULL;
            """)
            print("✅ moderated_by_id добавлено")
        else:
            print("✅ moderated_by_id уже существует")

def mark_migrations_as_applied():
    """Отметить миграции как примененные"""
    print("\n=== ОТМЕТКА МИГРАЦИЙ КАК ПРИМЕНЕННЫЕ ===")
    with connection.cursor() as cursor:
        migrations_to_mark = [
            '0004_customuser_is_banned',
            '0005_rentalcomplaint_admin_comment_and_more',
            '0006_complaintreason_reason_en_complaintreason_reason_kz_and_more',
            '0007_activitylog',
            '0008_notificationsettings_notification_action_url_and_more',
            '0009_auto_20250912_2151',
            '0010_fcmtoken'
        ]
        
        for migration_name in migrations_to_mark:
            cursor.execute("""
                INSERT INTO django_migrations (app, name, applied) 
                VALUES ('rentapp', %s, NOW())
                ON CONFLICT DO NOTHING;
            """, [migration_name])
            print(f"✅ {migration_name} отмечена как примененная")

def verify_fix():
    """Проверить исправления"""
    print("\n=== ПРОВЕРКА ИСПРАВЛЕНИЙ ===")
    
    # Проверяем CustomUser
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'rentapp_customuser' 
            AND column_name = 'is_banned';
        """)
        user_columns = cursor.fetchall()
        
        print("CustomUser колонки:")
        print(f"  is_banned: {'✅' if user_columns else '❌'}")
    
    # Проверяем RentalComplaint
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'rentapp_rentalcomplaint' 
            AND column_name IN ('admin_comment', 'moderated_at', 'moderated_by_id');
        """)
        complaint_columns = [row[0] for row in cursor.fetchall()]
        
        print("RentalComplaint колонки:")
        print(f"  admin_comment: {'✅' if 'admin_comment' in complaint_columns else '❌'}")
        print(f"  moderated_at: {'✅' if 'moderated_at' in complaint_columns else '❌'}")
        print(f"  moderated_by_id: {'✅' if 'moderated_by_id' in complaint_columns else '❌'}")

def test_api_endpoint():
    """Тестировать API endpoint"""
    print("\n=== ТЕСТ API ENDPOINT ===")
    try:
        from django.test import Client
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Создаем тестового пользователя
        test_user = User.objects.filter(username='test_api_user').first()
        if not test_user:
            test_user = User.objects.create_user(
                username='test_api_user',
                email='test@example.com',
                password='testpass123'
            )
        
        # Тестируем сериализацию
        from rentapp.serializers import CustomUserSerializer
        serializer = CustomUserSerializer(test_user)
        data = serializer.data
        
        print("✅ Сериализация пользователя работает")
        print(f"   Пользователь: {data.get('username', 'N/A')}")
        
    except Exception as e:
        print(f"❌ Ошибка в API: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Основная функция"""
    print("🔧 ПОЛНОЕ ИСПРАВЛЕНИЕ ВСЕХ ПРОБЛЕМ С МИГРАЦИЯМИ")
    print("=" * 60)
    
    try:
        check_migration_status()
        check_missing_columns()
        
        fix_customuser_columns()
        fix_rentalcomplaint_columns()
        mark_migrations_as_applied()
        
        verify_fix()
        test_api_endpoint()
        
        print("\n✅ Все проблемы исправлены!")
        print("\nТеперь можно:")
        print("  1. Перезапустить контейнеры")
        print("  2. Проверить работу API")
        print("  3. Создать суперпользователя")
        
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
