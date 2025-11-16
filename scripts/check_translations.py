#!/usr/bin/env python3
"""
Скрипт для проверки переводов в проекте.
Анализирует структуру файлов переводов и находит проблемы.
"""

import json
import os
from pathlib import Path
from typing import Dict, Set, List, Tuple
from collections import defaultdict

# Пути к файлам переводов
BASE_DIR = Path(__file__).parent.parent
LOCALES_DIR = BASE_DIR / "front" / "public" / "locales"
RU_FILE = LOCALES_DIR / "ru" / "common.json"
EN_FILE = LOCALES_DIR / "en" / "common.json"
KZ_FILE = LOCALES_DIR / "kz" / "common.json"


def get_all_keys(obj: Dict, prefix: str = "") -> Set[str]:
    """Рекурсивно получает все ключи из JSON объекта."""
    keys = set()
    for key, value in obj.items():
        if key.startswith("_"):  # Пропускаем служебные ключи
            continue
        full_key = f"{prefix}.{key}" if prefix else key
        keys.add(full_key)
        if isinstance(value, dict):
            keys.update(get_all_keys(value, full_key))
    return keys


def get_nested_value(obj: Dict, key_path: str):
    """Получает значение по пути ключа (например, 'profile.info')."""
    keys = key_path.split(".")
    value = obj
    for key in keys:
        if isinstance(value, dict) and key in value:
            value = value[key]
        else:
            return None
    return value


def find_missing_keys(base_keys: Set[str], target_obj: Dict) -> List[str]:
    """Находит ключи, которые есть в base_keys, но отсутствуют в target_obj."""
    missing = []
    for key in base_keys:
        if get_nested_value(target_obj, key) is None:
            missing.append(key)
    return sorted(missing)


def find_extra_keys(base_obj: Dict, target_keys: Set[str]) -> List[str]:
    """Находит ключи, которые есть в target_keys, но отсутствуют в base_obj."""
    base_keys = get_all_keys(base_obj)
    extra = []
    for key in target_keys:
        if key not in base_keys:
            extra.append(key)
    return sorted(extra)


def find_empty_values(obj: Dict, prefix: str = "") -> List[str]:
    """Находит ключи с пустыми значениями."""
    empty = []
    for key, value in obj.items():
        if key.startswith("_"):
            continue
        full_key = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            empty.extend(find_empty_values(value, full_key))
        elif value == "" or value is None:
            empty.append(full_key)
    return empty


def load_json_file(file_path: Path) -> Dict:
    """Загружает JSON файл."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"⚠️  Файл не найден: {file_path}")
        return {}
    except json.JSONDecodeError as e:
        print(f"❌ Ошибка парсинга JSON в {file_path}: {e}")
        return {}


def main():
    """Основная функция анализа."""
    print("=" * 80)
    print("ПРОВЕРКА ПЕРЕВОДОВ")
    print("=" * 80)
    print()

    # Загружаем файлы
    print("📂 Загрузка файлов переводов...")
    ru_data = load_json_file(RU_FILE)
    en_data = load_json_file(EN_FILE)
    kz_data = load_json_file(KZ_FILE)
    print(f"   ✓ Русский: {len(get_all_keys(ru_data))} ключей")
    print(f"   ✓ English: {len(get_all_keys(en_data))} ключей")
    print(f"   ✓ Қазақша: {len(get_all_keys(kz_data))} ключей")
    print()

    # Получаем все ключи
    ru_keys = get_all_keys(ru_data)
    en_keys = get_all_keys(en_data)
    kz_keys = get_all_keys(kz_data)

    # Находим отсутствующие ключи
    print("🔍 Поиск отсутствующих ключей...")
    en_missing = find_missing_keys(ru_keys, en_data)
    kz_missing = find_missing_keys(ru_keys, kz_data)
    
    print(f"   ⚠️  Отсутствует в EN: {len(en_missing)} ключей")
    print(f"   ⚠️  Отсутствует в KZ: {len(kz_missing)} ключей")
    print()

    # Находим лишние ключи
    print("🔍 Поиск лишних ключей...")
    en_extra = find_extra_keys(ru_data, en_keys)
    kz_extra = find_extra_keys(ru_data, kz_keys)
    
    print(f"   ⚠️  Лишние в EN: {len(en_extra)} ключей")
    print(f"   ⚠️  Лишние в KZ: {len(kz_extra)} ключей")
    print()

    # Находим пустые значения
    print("🔍 Поиск пустых значений...")
    ru_empty = find_empty_values(ru_data)
    en_empty = find_empty_values(en_data)
    kz_empty = find_empty_values(kz_data)
    
    print(f"   ⚠️  Пустые в RU: {len(ru_empty)} ключей")
    print(f"   ⚠️  Пустые в EN: {len(en_empty)} ключей")
    print(f"   ⚠️  Пустые в KZ: {len(kz_empty)} ключей")
    print()

    # Сохраняем результаты
    results = {
        "ru_keys_count": len(ru_keys),
        "en_keys_count": len(en_keys),
        "kz_keys_count": len(kz_keys),
        "en_missing": en_missing,
        "kz_missing": kz_missing,
        "en_extra": en_extra,
        "kz_extra": kz_extra,
        "ru_empty": ru_empty,
        "en_empty": en_empty,
        "kz_empty": kz_empty,
    }

    output_file = BASE_DIR / "translation_analysis.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"💾 Результаты сохранены в: {output_file}")
    print()

    # Выводим детали
    if en_missing:
        print("=" * 80)
        print("ОТСУТСТВУЮЩИЕ КЛЮЧИ В EN:")
        print("=" * 80)
        for key in en_missing[:50]:  # Показываем первые 50
            print(f"  - {key}")
        if len(en_missing) > 50:
            print(f"  ... и еще {len(en_missing) - 50} ключей")
        print()

    if kz_missing:
        print("=" * 80)
        print("ОТСУТСТВУЮЩИЕ КЛЮЧИ В KZ:")
        print("=" * 80)
        for key in kz_missing[:50]:  # Показываем первые 50
            print(f"  - {key}")
        if len(kz_missing) > 50:
            print(f"  ... и еще {len(kz_missing) - 50} ключей")
        print()

    if en_extra:
        print("=" * 80)
        print("ЛИШНИЕ КЛЮЧИ В EN (отсутствуют в RU):")
        print("=" * 80)
        for key in en_extra:
            print(f"  - {key}")
        print()

    if kz_extra:
        print("=" * 80)
        print("ЛИШНИЕ КЛЮЧИ В KZ (отсутствуют в RU):")
        print("=" * 80)
        for key in kz_extra:
            print(f"  - {key}")
        print()

    # Итоговая статистика
    print("=" * 80)
    print("ИТОГОВАЯ СТАТИСТИКА:")
    print("=" * 80)
    print(f"Всего ключей в RU: {len(ru_keys)}")
    print(f"Всего ключей в EN: {len(en_keys)}")
    print(f"Всего ключей в KZ: {len(kz_keys)}")
    print(f"Отсутствует в EN: {len(en_missing)}")
    print(f"Отсутствует в KZ: {len(kz_missing)}")
    print(f"Лишних в EN: {len(en_extra)}")
    print(f"Лишних в KZ: {len(kz_extra)}")
    print(f"Пустых значений в RU: {len(ru_empty)}")
    print(f"Пустых значений в EN: {len(en_empty)}")
    print(f"Пустых значений в KZ: {len(kz_empty)}")
    print()

    if not en_missing and not kz_missing and not en_extra and not kz_extra:
        print("✅ Все ключи синхронизированы!")
    else:
        print("⚠️  Обнаружены проблемы с синхронизацией ключей")


if __name__ == "__main__":
    main()

