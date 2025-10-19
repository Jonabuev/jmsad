"""
Валидаторы для загружаемых файлов
"""
from django.core.exceptions import ValidationError
import os


def validate_image_file(file):
    """
    Валидатор для изображений
    - Проверяет размер (максимум 10MB)
    - Проверяет расширение (только jpg, jpeg, png, gif, webp)
    """
    # Проверка размера (10MB максимум)
    max_size_mb = 10
    if file.size > max_size_mb * 1024 * 1024:
        raise ValidationError(f'Размер файла не должен превышать {max_size_mb}MB')
    
    # Проверка расширения
    ext = os.path.splitext(file.name)[1].lower()
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    if ext not in valid_extensions:
        raise ValidationError(
            f'Недопустимое расширение файла. Разрешены: {", ".join(valid_extensions)}'
        )
    
    # Проверка MIME-типа
    valid_mime_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if hasattr(file, 'content_type') and file.content_type not in valid_mime_types:
        raise ValidationError('Недопустимый тип файла')
    
    return file


def validate_document_file(file):
    """
    Валидатор для документов
    - Проверяет размер (максимум 20MB)
    - Проверяет расширение (только pdf, doc, docx)
    """
    # Проверка размера (20MB максимум)
    max_size_mb = 20
    if file.size > max_size_mb * 1024 * 1024:
        raise ValidationError(f'Размер файла не должен превышать {max_size_mb}MB')
    
    # Проверка расширения
    ext = os.path.splitext(file.name)[1].lower()
    valid_extensions = ['.pdf', '.doc', '.docx']
    if ext not in valid_extensions:
        raise ValidationError(
            f'Недопустимое расширение файла. Разрешены: {", ".join(valid_extensions)}'
        )
    
    # Проверка MIME-типа
    valid_mime_types = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if hasattr(file, 'content_type') and file.content_type not in valid_mime_types:
        raise ValidationError('Недопустимый тип файла')
    
    return file


def validate_avatar_image(file):
    """
    Валидатор для аватаров
    - Проверяет размер (максимум 5MB)
    - Проверяет расширение (только jpg, jpeg, png)
    """
    # Проверка размера (5MB максимум)
    max_size_mb = 5
    if file.size > max_size_mb * 1024 * 1024:
        raise ValidationError(f'Размер файла не должен превышать {max_size_mb}MB')
    
    # Проверка расширения
    ext = os.path.splitext(file.name)[1].lower()
    valid_extensions = ['.jpg', '.jpeg', '.png']
    if ext not in valid_extensions:
        raise ValidationError(
            f'Недопустимое расширение файла. Разрешены: {", ".join(valid_extensions)}'
        )
    
    # Проверка MIME-типа
    valid_mime_types = ['image/jpeg', 'image/png']
    if hasattr(file, 'content_type') and file.content_type not in valid_mime_types:
        raise ValidationError('Недопустимый тип файла')
    
    return file

