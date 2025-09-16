#!/usr/bin/env python
"""
Скрипт для исправления проблем с миграциями
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
    print("Проверка статуса миграций...")
    execute_from_command_line(['manage.py', 'showmigrations', 'rentapp'])

def check_database_schema():
    """Проверить схему базы данных"""
    print("\nПроверка схемы базы данных...")
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'rentapp_complaintreason'
            ORDER BY column_name;
        """)
        columns = cursor.fetchall()
        print("Существующие колонки в rentapp_complaintreason:")
        for column in columns:
            print(f"  - {column[0]}")

def fix_migration_issue():
    """Исправить проблему с миграциями"""
    print("\nИсправление проблемы с миграциями...")
    
    # Проверим, есть ли поля reason_kz и reason_en
    with connection.cursor() as cursor:
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
            
        if 'reason_en' not in existing_columns:
            print("Добавление поля reason_en...")
            cursor.execute("""
                ALTER TABLE rentapp_complaintreason 
                ADD COLUMN reason_en VARCHAR(255) NULL;
            """)
    
    print("Поля добавлены успешно!")

def mark_migration_as_applied():
    """Отметить миграцию как примененную"""
    print("\nОтметка миграции 0006 как примененной...")
    with connection.cursor() as cursor:
        cursor.execute("""
            INSERT INTO django_migrations (app, name, applied) 
            VALUES ('rentapp', '0006_complaintreason_reason_en_complaintreason_reason_kz_and_more', NOW())
            ON CONFLICT (app, name) DO NOTHING;
        """)
    print("Миграция отмечена как примененная!")

def main():
    """Основная функция"""
    print("=== Исправление проблем с миграциями ===")
    
    try:
        check_migration_status()
        check_database_schema()
        fix_migration_issue()
        mark_migration_as_applied()
        
        print("\n=== Проверка после исправления ===")
        check_database_schema()
        
        print("\n✅ Проблема исправлена! Теперь можно выполнить миграции.")
        
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
