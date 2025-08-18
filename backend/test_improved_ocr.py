#!/usr/bin/env python3
"""
Тестовый скрипт для проверки улучшенного OCR
"""

import os
import sys
from PIL import Image, ImageEnhance, ImageFilter

# Добавляем путь к проекту
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_image_enhancement():
    """Тестирует улучшение изображения"""
    print("🧪 Тестирование улучшения изображения...")
    
    try:
        # Создаем тестовое изображение
        test_image = Image.new('RGB', (800, 600), color='white')
        
        # Применяем улучшения
        width, height = test_image.size
        if width < 1000 or height < 1000:
            scale_factor = max(1000 / width, 1000 / height)
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            test_image = test_image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Улучшаем контрастность
        enhancer = ImageEnhance.Contrast(test_image)
        test_image = enhancer.enhance(1.5)
        
        # Улучшаем резкость
        enhancer = ImageEnhance.Sharpness(test_image)
        test_image = enhancer.enhance(1.2)
        
        # Применяем фильтр
        test_image = test_image.filter(ImageFilter.MedianFilter(size=1))
        
        print(f"✅ Изображение улучшено: {test_image.size}")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при улучшении изображения: {e}")
        return False

def test_text_cleaning():
    """Тестирует очистку текста"""
    print("🧪 Тестирование очистки текста...")
    
    try:
        # Импортируем функцию очистки
        from myproject.views import clean_extracted_text
        
        # Тестовый текст с артефактами
        test_text = "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<"
        test_text += "авоеу<<2амівек<<<<<<<<<<<<<<<<<<<<<"
        test_text += "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<"
        
        cleaned = clean_extracted_text(test_text)
        print(f"✅ Текст очищен: {cleaned}")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при очистке текста: {e}")
        return False

def test_tesseract_config():
    """Тестирует конфигурацию Tesseract"""
    print("🧪 Тестирование конфигурации Tesseract...")
    
    try:
        # Импортируем конфигурацию
        from rentapp.views.tesseract_config import tesseract_path
        
        if tesseract_path:
            print(f"✅ Tesseract найден: {tesseract_path}")
            
            # Тестируем pytesseract
            import pytesseract
            
            # Проверяем версию
            version = pytesseract.get_tesseract_version()
            print(f"✅ Версия Tesseract: {version}")
            
            # Проверяем языки
            langs = pytesseract.get_languages()
            print(f"✅ Доступные языки: {', '.join(langs)}")
            
            return True
            
        else:
            print("❌ Tesseract не найден")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при тестировании Tesseract: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Запуск тестов улучшенного OCR...")
    
    tests = [
        test_image_enhancement,
        test_text_cleaning,
        test_tesseract_config
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print(f"📊 Результаты тестов: {passed}/{total} пройдено")
    
    if passed == total:
        print("🎉 Все тесты пройдены успешно!")
    else:
        print("⚠️ Некоторые тесты не пройдены")
