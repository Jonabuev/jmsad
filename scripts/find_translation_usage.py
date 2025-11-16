#!/usr/bin/env python3
"""
Скрипт для поиска использования ключей переводов в коде.
"""

import re
import json
from pathlib import Path
from typing import Set, Dict, List
from collections import defaultdict

BASE_DIR = Path(__file__).parent.parent
FRONT_SRC = BASE_DIR / "front" / "src"
LOCALES_DIR = BASE_DIR / "front" / "public" / "locales"
RU_FILE = LOCALES_DIR / "ru" / "common.json"


def get_all_keys_from_json(obj: Dict, prefix: str = "") -> Set[str]:
    """Рекурсивно получает все ключи из JSON объекта."""
    keys = set()
    for key, value in obj.items():
        if key.startswith("_"):
            continue
        full_key = f"{prefix}.{key}" if prefix else key
        keys.add(full_key)
        if isinstance(value, dict):
            keys.update(get_all_keys_from_json(value, full_key))
    return keys


def find_translation_keys_in_file(file_path: Path) -> Set[str]:
    """Находит все используемые ключи переводов в файле."""
    keys = set()
    try:
        content = file_path.read_text(encoding="utf-8")
        
        # Паттерны для поиска использования переводов
        patterns = [
            # t("key") или t('key')
            r't\(["\']([^"\']+)["\']\)',
            # t("key.subkey") или t('key.subkey')
            r't\(["\']([^"\']+\.[^"\']+)["\']\)',
            # t(`key`) или t(`key.subkey`)
            r't\(`([^`]+)`\)',
            # useTranslation("common") - это не ключ, пропускаем
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                # Убираем возможные интерполяции
                key = match.split("{{")[0].strip()
                if key and not key.startswith("common"):
                    keys.add(key)
        
        # Также ищем использование через объекты типа t("profile.info")
        # Ищем строки вида "profile.info" или 'profile.info'
        string_pattern = r'["\']([a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)+)["\']'
        string_matches = re.findall(string_pattern, content)
        for match, _ in string_matches:
            # Проверяем, что это похоже на ключ перевода (содержит точку)
            if "." in match and not match.startswith("http") and not match.startswith("/"):
                # Проверяем контекст - это должно быть в вызове t() или похожем
                key_context = content[max(0, content.find(match) - 20):content.find(match) + len(match) + 20]
                if "t(" in key_context or "useTranslation" in key_context:
                    keys.add(match)
        
    except Exception as e:
        print(f"⚠️  Ошибка при чтении {file_path}: {e}")
    
    return keys


def scan_directory(directory: Path, extensions: List[str] = [".tsx", ".ts", ".jsx", ".js"]) -> Dict[str, Set[str]]:
    """Сканирует директорию и находит все используемые ключи переводов."""
    usage = defaultdict(set)
    
    for ext in extensions:
        for file_path in directory.rglob(f"*{ext}"):
            if "node_modules" in str(file_path) or ".next" in str(file_path):
                continue
            
            keys = find_translation_keys_in_file(file_path)
            if keys:
                usage[str(file_path.relative_to(BASE_DIR))] = keys
    
    return usage


def main():
    """Основная функция."""
    print("=" * 80)
    print("ПОИСК ИСПОЛЬЗОВАНИЯ ПЕРЕВОДОВ В КОДЕ")
    print("=" * 80)
    print()

    # Загружаем все ключи из RU файла
    print("📂 Загрузка ключей из файла переводов...")
    with open(RU_FILE, "r", encoding="utf-8") as f:
        ru_data = json.load(f)
    
    all_translation_keys = get_all_keys_from_json(ru_data)
    print(f"   ✓ Всего ключей в файле переводов: {len(all_translation_keys)}")
    print()

    # Сканируем код
    print("🔍 Сканирование кода...")
    usage = scan_directory(FRONT_SRC)
    
    # Собираем все используемые ключи
    used_keys = set()
    for file_path, keys in usage.items():
        used_keys.update(keys)
    
    print(f"   ✓ Найдено файлов с переводами: {len(usage)}")
    print(f"   ✓ Найдено уникальных используемых ключей: {len(used_keys)}")
    print()

    # Находим неиспользуемые ключи
    unused_keys = all_translation_keys - used_keys
    
    # Находим ключи, используемые в коде, но отсутствующие в файле переводов
    missing_keys = used_keys - all_translation_keys

    print("=" * 80)
    print("РЕЗУЛЬТАТЫ:")
    print("=" * 80)
    print(f"Всего ключей в файле переводов: {len(all_translation_keys)}")
    print(f"Используется в коде: {len(used_keys)}")
    print(f"Не используется: {len(unused_keys)}")
    print(f"Используется, но отсутствует в файле: {len(missing_keys)}")
    print()

    # Сохраняем результаты
    results = {
        "total_keys": len(all_translation_keys),
        "used_keys_count": len(used_keys),
        "unused_keys_count": len(unused_keys),
        "missing_keys_count": len(missing_keys),
        "unused_keys": sorted(list(unused_keys)),
        "missing_keys": sorted(list(missing_keys)),
        "usage_by_file": {k: sorted(list(v)) for k, v in usage.items()}
    }

    output_file = BASE_DIR / "translation_usage.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"💾 Результаты сохранены в: {output_file}")
    print()

    # Выводим неиспользуемые ключи (первые 50)
    if unused_keys:
        print("=" * 80)
        print("НЕИСПОЛЬЗУЕМЫЕ КЛЮЧИ (первые 50):")
        print("=" * 80)
        for key in sorted(list(unused_keys))[:50]:
            print(f"  - {key}")
        if len(unused_keys) > 50:
            print(f"  ... и еще {len(unused_keys) - 50} ключей")
        print()

    # Выводим отсутствующие ключи
    if missing_keys:
        print("=" * 80)
        print("КЛЮЧИ, ИСПОЛЬЗУЕМЫЕ В КОДЕ, НО ОТСУТСТВУЮЩИЕ В ФАЙЛЕ:")
        print("=" * 80)
        for key in sorted(list(missing_keys)):
            print(f"  - {key}")
        print()


if __name__ == "__main__":
    main()

