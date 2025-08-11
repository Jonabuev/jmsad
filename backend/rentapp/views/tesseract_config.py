import os
import sys

# Определяем путь к Tesseract в зависимости от окружения
if os.path.exists('/usr/bin/tesseract'):
    # Docker/Linux окружение
    tesseract_path = '/usr/bin/tesseract'
    print(f"✅ Tesseract найден в Docker: {tesseract_path}")
elif os.path.exists(r'C:\Program Files\Tesseract-OCR\tesseract.exe'):
    # Windows окружение
    tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    print(f"✅ Tesseract найден в Windows: {tesseract_path}")
else:
    # Попробуем найти в PATH
    tesseract_path = 'tesseract'
    print(f"⚠️ Используем Tesseract из PATH: {tesseract_path}")

# Настройка pytesseract
import pytesseract
pytesseract.pytesseract.tesseract_cmd = tesseract_path

# Проверяем доступность Tesseract
try:
    import pytesseract
    version = pytesseract.get_tesseract_version()
    print(f"✅ Tesseract версия: {version}")
except Exception as e:
    print(f"❌ Ошибка при проверке Tesseract: {str(e)}") 