import io
from PIL import Image
from pdf2image import convert_from_bytes
import pytesseract

def extract_text(image):
    """Извлекает текст с изображения с помощью Tesseract"""
    try:
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        extracted_text = pytesseract.image_to_string(image, lang='eng+rus+kaz')
        return extracted_text.strip()
    except Exception as e:
        return f"Error during OCR processing: {str(e)}"


def convert_file_to_image(file):
    try:
        file_ext = file.name.lower().split(".")[-1]
        print(f"📂 Загруженный файл: {file.name}, Расширение: {file_ext}")

        if file_ext == "pdf":
            images = convert_from_bytes(file.read())
            print(f"📸 Количество извлечённых страниц: {len(images)}")

            if images:
                return images[0].convert("RGB")
            else:
                raise ValueError("Не удалось извлечь страницы из PDF")
        else:
            image = Image.open(io.BytesIO(file.read()))
            print(f"🖼 Изображение загружено: {image.format}, Размер: {image.size}")
            return image.convert("RGB") if image.mode in ("RGBA", "P") else image

    except Exception as e:
        print(f"❌ Ошибка в convert_file_to_image: {str(e)}")
        raise ValueError(f"Ошибка при обработке файла: {str(e)}")
