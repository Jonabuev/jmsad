# import io
# from PIL import Image
# from pdf2image import convert_from_bytes
# import os

# # Импортируем настройку Tesseract
# from .tesseract_config import pytesseract

# def extract_text(image):
#     """Извлекает текст с изображения с помощью Tesseract"""
#     try:
#         if image.mode in ("RGBA", "P"):
#             image = image.convert("RGB")

#         # Попробуем разные языки
#         languages = ['eng+rus+kaz', 'eng+rus', 'eng', 'rus']
        
#         for lang in languages:
#             try:
#                 extracted_text = pytesseract.image_to_string(image, lang=lang)
#                 if extracted_text.strip():
#                     print(f"✅ OCR успешен с языком: {lang}")
#                     return extracted_text.strip()
#             except Exception as e:
#                 print(f"⚠️ Ошибка с языком {lang}: {str(e)}")
#                 continue
        
#         # Если ничего не получилось, попробуем без указания языка
#         try:
#             extracted_text = pytesseract.image_to_string(image)
#             return extracted_text.strip()
#         except Exception as e:
#             return f"Error during OCR processing: {str(e)}"
            
#     except Exception as e:
#         return f"Error during OCR processing: {str(e)}"


# def convert_file_to_image(file):
#     try:
#         file_ext = file.name.lower().split(".")[-1]
#         print(f"📂 Загруженный файл: {file.name}, Расширение: {file_ext}")

#         if file_ext == "pdf":
#             images = convert_from_bytes(file.read())
#             print(f"📸 Количество извлечённых страниц: {len(images)}")

#             if images:
#                 return images[0].convert("RGB")
#             else:
#                 raise ValueError("Не удалось извлечь страницы из PDF")
#         else:
#             image = Image.open(io.BytesIO(file.read()))
#             print(f"🖼 Изображение загружено: {image.format}, Размер: {image.size}")
#             return image.convert("RGB") if image.mode in ("RGBA", "P") else image

#     except Exception as e:
#         print(f"❌ Ошибка в convert_file_to_image: {str(e)}")
#         raise ValueError(f"Ошибка при обработке файла: {str(e)}")
