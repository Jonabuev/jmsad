import os
import sys

# Добавляем путь к Tesseract в PATH
tesseract_path = r'C:\Program Files\Tesseract-OCR'
if os.path.exists(tesseract_path):
    if tesseract_path not in os.environ['PATH']:
        os.environ['PATH'] = tesseract_path + os.pathsep + os.environ['PATH']
    print(f"✅ Tesseract добавлен в PATH: {tesseract_path}")
else:
    print(f"❌ Tesseract не найден по пути: {tesseract_path}")

# Настройка pytesseract
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe' 