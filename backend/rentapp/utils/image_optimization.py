"""
Утилиты для оптимизации изображений
Автоматически сжимает и изменяет размер изображений при загрузке
"""

from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys
import logging

logger = logging.getLogger(__name__)


def compress_image(image_field, max_width=1920, max_height=1920, quality=85, format='JPEG'):
    """
    Сжимает и оптимизирует изображение
    
    Args:
        image_field: Django ImageField или FileField с изображением
        max_width: Максимальная ширина (по умолчанию 1920px)
        max_height: Максимальная высота (по умолчанию 1920px)
        quality: Качество JPEG (1-100, по умолчанию 85)
        format: Формат вывода ('JPEG' или 'PNG')
    
    Returns:
        InMemoryUploadedFile: Оптимизированное изображение
    """
    try:
        # Открываем изображение
        img = Image.open(image_field)
        
        # Сохраняем оригинальный формат если нужно
        original_format = img.format
        
        # Получаем имя файла
        filename = image_field.name
        
        # Конвертируем RGBA/LA/P в RGB для JPEG
        if format == 'JPEG' and img.mode in ('RGBA', 'LA', 'P'):
            # Создаем белый фон
            background = Image.new('RGB', img.size, (255, 255, 255))
            
            # Если есть альфа-канал, используем его как маску
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[-1])
            else:
                background.paste(img)
            
            img = background
        elif format == 'PNG' and img.mode not in ('RGBA', 'RGB', 'P'):
            img = img.convert('RGBA')
        
        # Изменяем размер если изображение больше максимальных размеров
        if img.width > max_width or img.height > max_height:
            # Вычисляем пропорции
            ratio = min(max_width / img.width, max_height / img.height)
            new_size = (int(img.width * ratio), int(img.height * ratio))
            
            # Изменяем размер с высоким качеством
            img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            logger.info(f"Изображение уменьшено с {image_field.size} до {new_size}")
        
        # Применяем оптимизацию
        if format == 'JPEG':
            # Дополнительная оптимизация для JPEG
            img = img.convert('RGB')
        
        # Сохраняем в буфер
        output = BytesIO()
        
        if format == 'JPEG':
            img.save(
                output,
                format='JPEG',
                quality=quality,
                optimize=True,
                progressive=True  # Прогрессивный JPEG для веба
            )
            content_type = 'image/jpeg'
            # Меняем расширение на .jpg
            filename = filename.rsplit('.', 1)[0] + '.jpg'
        else:
            img.save(
                output,
                format='PNG',
                optimize=True
            )
            content_type = 'image/png'
            filename = filename.rsplit('.', 1)[0] + '.png'
        
        output.seek(0)
        
        # Создаем новый файл
        optimized_file = InMemoryUploadedFile(
            output,
            'ImageField',
            filename,
            content_type,
            sys.getsizeof(output),
            None
        )
        
        logger.info(f"Изображение оптимизировано: {filename}")
        
        return optimized_file
        
    except Exception as e:
        logger.error(f"Ошибка при оптимизации изображения: {e}")
        # Возвращаем оригинал если не удалось оптимизировать
        return image_field


def optimize_avatar(image_field):
    """
    Оптимизирует аватар пользователя (квадрат 400x400)
    """
    return compress_image(
        image_field,
        max_width=400,
        max_height=400,
        quality=90,
        format='JPEG'
    )


def optimize_house_image(image_field):
    """
    Оптимизирует изображение недвижимости (1920x1080)
    """
    return compress_image(
        image_field,
        max_width=1920,
        max_height=1080,
        quality=85,
        format='JPEG'
    )


def optimize_complaint_image(image_field):
    """
    Оптимизирует изображение к жалобе (1200x1200)
    """
    return compress_image(
        image_field,
        max_width=1200,
        max_height=1200,
        quality=85,
        format='JPEG'
    )


def optimize_document_image(image_field):
    """
    Оптимизирует сканы документов (высокое качество, 2400x3200)
    """
    return compress_image(
        image_field,
        max_width=2400,
        max_height=3200,
        quality=92,  # Высокое качество для читаемости текста
        format='JPEG'
    )

