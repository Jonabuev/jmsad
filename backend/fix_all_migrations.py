#!/usr/bin/env python
"""
Скрипт для исправления всех проблем с миграциями
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
    
    # Проверяем ComplaintReason
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'rentapp_complaintreason' 
            AND column_name IN ('reason_kz', 'reason_en');
        """)
        complaint_columns = [row[0] for row in cursor.fetchall()]
        
        print("ComplaintReason:")
        if 'reason_kz' not in complaint_columns:
            print("  ❌ reason_kz отсутствует")
        else:
            print("  ✅ reason_kz существует")
            
        if 'reason_en' not in complaint_columns:
            print("  ❌ reason_en отсутствует")
        else:
            print("  ✅ reason_en существует")
    
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

def fix_complaint_reason_columns():
    """Исправить колонки ComplaintReason"""
    print("\n=== ИСПРАВЛЕНИЕ КОЛОНОК COMPLAINTREASON ===")
    with connection.cursor() as cursor:
        # Проверяем существование полей
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'rentapp_complaintreason' 
            AND column_name IN ('reason_kz', 'reason_en');
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        if 'reason_kz' not in existing_columns:
            print("Добавление поля reason_kz...")
            cursor.execute("""
                ALTER TABLE rentapp_complaintreason 
                ADD COLUMN reason_kz VARCHAR(255) NULL;
            """)
            print("✅ reason_kz добавлено")
            
        if 'reason_en' not in existing_columns:
            print("Добавление поля reason_en...")
            cursor.execute("""
                ALTER TABLE rentapp_complaintreason 
                ADD COLUMN reason_en VARCHAR(255) NULL;
            """)
            print("✅ reason_en добавлено")

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

def mark_migrations_as_applied():
    """Отметить миграции как примененные"""
    print("\n=== ОТМЕТКА МИГРАЦИЙ КАК ПРИМЕНЕННЫЕ ===")
    with connection.cursor() as cursor:
        migrations_to_mark = [
            '0004_customuser_is_banned',
            '0006_complaintreason_reason_en_complaintreason_reason_kz_and_more'
        ]
        
        for migration_name in migrations_to_mark:
            cursor.execute("""
                INSERT INTO django_migrations (app, name, applied) 
                VALUES ('rentapp', %s, NOW())
                ON CONFLICT (app, name) DO NOTHING;
            """, [migration_name])
            print(f"✅ {migration_name} отмечена как примененная")

def apply_remaining_migrations():
    """Применить оставшиеся миграции"""
    print("\n=== ПРИМЕНЕНИЕ ОСТАВШИХСЯ МИГРАЦИЙ ===")
    try:
        execute_from_command_line(['manage.py', 'migrate', 'rentapp', '--fake-initial'])
        print("✅ Миграции применены с --fake-initial")
    except Exception as e:
        print(f"❌ Ошибка при применении миграций: {e}")

def verify_fix():
    """Проверить исправления"""
    print("\n=== ПРОВЕРКА ИСПРАВЛЕНИЙ ===")
    
    # Проверяем ComplaintReason
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'rentapp_complaintreason' 
            AND column_name IN ('reason_kz', 'reason_en');
        """)
        complaint_columns = [row[0] for row in cursor.fetchall()]
        
        print("ComplaintReason колонки:")
        print(f"  reason_kz: {'✅' if 'reason_kz' in complaint_columns else '❌'}")
        print(f"  reason_en: {'✅' if 'reason_en' in complaint_columns else '❌'}")
    
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

def main():
    """Основная функция"""
    print("🔧 ИСПРАВЛЕНИЕ ВСЕХ ПРОБЛЕМ С МИГРАЦИЯМИ")
    print("=" * 50)
    
    try:
        check_migration_status()
        check_missing_columns()
        
        fix_complaint_reason_columns()
        fix_customuser_columns()
        mark_migrations_as_applied()
        
        verify_fix()
        
        print("\n✅ Все проблемы исправлены!")
        print("\nТеперь можно выполнить:")
        print("  sudo docker exec jmsad_backend_vps python manage.py migrate")
        print("  sudo docker exec -it jmsad_backend_vps python manage.py createsuperuser")
        
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
