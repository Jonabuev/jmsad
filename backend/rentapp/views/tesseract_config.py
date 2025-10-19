import os
import sys
import subprocess
import shutil

def install_tesseract_if_needed():
    """Автоматически устанавливает Tesseract, если он не найден"""
    try:
        # Проверяем, есть ли tesseract в системе
        if shutil.which('tesseract'):
            print("[OK] Tesseract найден в системе")
            return True
            
        # Проверяем стандартные пути
        tesseract_paths = [
            '/usr/bin/tesseract',  # Docker/Linux
            '/usr/local/bin/tesseract',  # macOS
            r'C:\Program Files\Tesseract-OCR\tesseract.exe',  # Windows
            r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',  # Windows x86
        ]
        
        for path in tesseract_paths:
            if os.path.exists(path):
                print(f"[OK] Tesseract найден по пути: {path}")
                return True
        
        # Если Tesseract не найден, пытаемся установить
        print("[WARNING] Tesseract не найден, пытаемся установить...")
        
        # Определяем ОС
        if os.name == 'nt':  # Windows
            print("[ERROR] Автоматическая установка Tesseract в Windows не поддерживается")
            print("[INFO] Пожалуйста, скачайте и установите Tesseract вручную:")
            print("   https://github.com/UB-Mannheim/tesseract/wiki")
            return False
        else:  # Linux/macOS/Docker
            try:
                # Пытаемся установить через apt (Ubuntu/Debian)
                if os.path.exists('/etc/debian_version'):
                    subprocess.run(['apt-get', 'update'], check=True)
                    subprocess.run([
                        'apt-get', 'install', '-y', 
                        'tesseract-ocr', 
                        'tesseract-ocr-rus', 
                        'tesseract-ocr-eng',
                        'tesseract-ocr-kaz'
                    ], check=True)
                    print("[OK] Tesseract успешно установлен через apt")
                    return True
                # Пытаемся установить через yum (CentOS/RHEL)
                elif os.path.exists('/etc/redhat-release'):
                    subprocess.run([
                        'yum', 'install', '-y', 
                        'tesseract', 
                        'tesseract-langpack-rus', 
                        'tesseract-langpack-eng'
                    ], check=True)
                    print("[OK] Tesseract успешно установлен через yum")
                    return True
                else:
                    print("[ERROR] Неизвестная система, не удается автоматически установить Tesseract")
                    return False
            except subprocess.CalledProcessError as e:
                print(f"[ERROR] Ошибка при установке Tesseract: {e}")
                return False
                
    except Exception as e:
        print(f"[ERROR] Ошибка при проверке/установке Tesseract: {e}")
        return False

def get_tesseract_path():
    """Возвращает путь к Tesseract"""
    # Сначала пытаемся установить, если нужно
    if not install_tesseract_if_needed():
        return None
    
    # Ищем Tesseract в системе
    tesseract_paths = [
        '/usr/bin/tesseract',  # Docker/Linux
        '/usr/local/bin/tesseract',  # macOS
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',  # Windows
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',  # Windows x86
    ]
    
    for path in tesseract_paths:
        if os.path.exists(path):
            return path
    
    # Проверяем PATH
    if shutil.which('tesseract'):
        return 'tesseract'
    
    return None

# Получаем путь к Tesseract
tesseract_path = get_tesseract_path()

if tesseract_path:
    print(f"[OK] Используем Tesseract: {tesseract_path}")
    
    # Настройка pytesseract
    try:
        import pytesseract
        pytesseract.pytesseract.tesseract_cmd = tesseract_path
        
        # Проверяем версию
        version = pytesseract.get_tesseract_version()
        print(f"[OK] Tesseract версия: {version}")
        
        # Проверяем доступные языки
        try:
            langs = pytesseract.get_languages()
            print(f"[OK] Доступные языки: {', '.join(langs)}")
        except:
            print("[WARNING] Не удалось получить список языков")
            
    except Exception as e:
        print(f"[ERROR] Ошибка при настройке pytesseract: {e}")
        tesseract_path = None
else:
    print("[ERROR] Tesseract не найден и не может быть установлен")
    print("[INFO] Для работы с OCR необходимо установить Tesseract:")
    print("   - Windows: https://github.com/UB-Mannheim/tesseract/wiki")
    print("   - Linux: sudo apt-get install tesseract-ocr")
    print("   - macOS: brew install tesseract") 
# Определяем путь к Tesseract в зависимости от окружения
if os.path.exists('/usr/bin/tesseract'):
    # Docker/Linux окружение
    tesseract_path = '/usr/bin/tesseract'
    print(f"[OK] Tesseract найден в Docker: {tesseract_path}")
elif os.path.exists(r'C:\Program Files\Tesseract-OCR\tesseract.exe'):
    # Windows окружение
    tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    print(f"[OK] Tesseract найден в Windows: {tesseract_path}")
else:
    # Попробуем найти в PATH
    tesseract_path = 'tesseract'
    print(f"[WARNING] Используем Tesseract из PATH: {tesseract_path}")

# Настройка pytesseract
import pytesseract
pytesseract.pytesseract.tesseract_cmd = tesseract_path

# Проверяем доступность Tesseract
try:
    import pytesseract
    version = pytesseract.get_tesseract_version()
    print(f"[OK] Tesseract версия: {version}")
except Exception as e:
    print(f"[ERROR] Ошибка при проверке Tesseract: {str(e)}") 
