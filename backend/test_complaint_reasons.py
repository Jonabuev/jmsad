#!/usr/bin/env python
"""
Скрипт для тестирования автоматизации причин жалоб.
Запускать из корневой директории проекта: python test_complaint_reasons.py
"""

import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from rentapp.models import ComplaintReason


def test_default_reasons():
    """Тестирует создание и получение дефолтных причин"""
    print("🧪 Тестирование автоматизации причин жалоб...")
    
    # Очищаем существующие причины для чистого теста
    print("🗑️ Очищаем существующие причины...")
    ComplaintReason.objects.all().delete()
    
    # Тестируем создание дефолтных причин
    print("📝 Создаем дефолтные причины...")
    ComplaintReason.ensure_default_reasons_exist()
    
    # Проверяем количество созданных причин
    total_reasons = ComplaintReason.objects.count()
    landlord_reasons = ComplaintReason.objects.filter(type='landlord', is_default=True).count()
    tenant_reasons = ComplaintReason.objects.filter(type='tenant', is_default=True).count()
    
    print(f"✅ Всего создано причин: {total_reasons}")
    print(f"✅ Причин для арендодателей: {landlord_reasons}")
    print(f"✅ Причин для арендаторов: {tenant_reasons}")
    
    # Выводим созданные причины
    print("\n📋 Причины для жалоб на арендодателей:")
    for reason in ComplaintReason.get_default_reasons_for_type('landlord'):
        print(f"  {reason.order + 1}. {reason.reason}")
    
    print("\n📋 Причины для жалоб на арендаторов:")
    for reason in ComplaintReason.get_default_reasons_for_type('tenant'):
        print(f"  {reason.order + 1}. {reason.reason}")
    
    # Тестируем повторный вызов (не должно создавать дубликаты)
    print("\n🔄 Тестируем повторное создание (не должно создавать дубликаты)...")
    ComplaintReason.ensure_default_reasons_exist()
    
    total_after = ComplaintReason.objects.count()
    if total_after == total_reasons:
        print("✅ Дубликаты не созданы - тест пройден!")
    else:
        print(f"❌ Созданы дубликаты: было {total_reasons}, стало {total_after}")
    
    print("\n🎉 Тестирование завершено!")


if __name__ == "__main__":
    test_default_reasons()
