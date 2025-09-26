import re
import pytesseract
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from PyPDF2 import PdfReader
from pdf2image import convert_from_bytes
from PIL import Image

# ==========================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# ==========================
def extract_case_number(text: str):
    return re.findall(r"№\s*[\d\-\/]{6,}", text)


def extract_main_accused(text: str):
    keywords = [
        r"ПРИГОВОРИЛ",
        r"Ү\s*К\s*І\s*М\s*Е\s*Т\s*Т\s*І",
        r"ҮКІМ\s*ЕТТІ",
        r"CONVICTED"
    ]
    pattern = r"(?:{})(?::|-)?\s*(.*)".format("|".join(keywords))

    match = re.search(pattern, text, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        return None

    after_text = match.group(1)
    words = after_text.split()

    fio_pattern = re.compile(r"^[А-ЯЁA-ZӘІҢҒҮҰҚӨҺ][а-яёa-zәіңғүұқөһ]+$")

    patronymic_endings = (
        "вич", "вна", "ович", "евич", "ична",
        "улы", "ұлы", "қызы",
        "оглы", "огли", "zade",
        "ов", "ев", "ин", "ын", "ынов", "инов",
        "ский", "цкий", "ая", "яя"
    )
    extended_endings = patronymic_endings + \
        tuple(e + "а" for e in patronymic_endings)

    found_fios = []

    for i in range(len(words) - 2):
        w1, w2, w3 = words[i:i+3]
        if fio_pattern.match(w1) and fio_pattern.match(w2) and fio_pattern.match(w3):
            if any(w3.lower().endswith(end) for end in extended_endings):
                after = " ".join(words[i+3:i+8])
                fio = f"{w1} {w2} {w3}"
                found_fios.append({
                    "fio": fio,
                    "after": after
                })

    unique = []
    seen = set()
    for f in found_fios:
        if f["fio"] not in seen:
            seen.add(f["fio"])
            unique.append(f)

    return unique if unique else None


def extract_birth_date(text: str):
    months = {
        # Казахский
        "қаңтар": 1, "ақпан": 2, "наурыз": 3, "сәуір": 4,
        "мамыр": 5, "маусым": 6, "шілде": 7, "тамыз": 8,
        "қыркүйек": 9, "қазан": 10, "қараша": 11, "желтоқсан": 12,

        # Русский
        "января": 1, "февраля": 2, "марта": 3, "апреля": 4,
        "мая": 5, "июня": 6, "июля": 7, "августа": 8,
        "сентября": 9, "октября": 10, "ноября": 11, "декабря": 12,

        # Английский
        "january": 1, "february": 2, "march": 3, "april": 4,
        "may": 5, "june": 6, "july": 7, "august": 8,
        "september": 9, "october": 10, "november": 11, "december": 12,
    }

    birth_context = re.compile(
        r"((\d{1,2})\s+([А-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһA-Za-z]+)\s+(\d{4}))"
        r".{0,30}?(туған|года рождения|родился|уроженец|born)",
        flags=re.IGNORECASE
    )

    match = birth_context.search(text)
    if not match:
        return None

    full_date, day, month_word, year, _ctx = match.groups()
    month_word = month_word.lower()

    if month_word in months:
        month = months[month_word]
        return f"{int(day):02d}.{month:02d}.{year}"

    return None


def extract_text_from_pdf(pdf_file) -> str:
    """ Сначала пробуем PyPDF2, если пусто — OCR """
    text = ""

    try:
        reader = PdfReader(pdf_file)
        for page in reader.pages:
            text += page.extract_text() or ""
    except Exception as e:
        print(f"⚠️ PdfReader error: {e}")

    if text.strip():
        return text

    # OCR fallback (сканированный PDF)
    pdf_file.seek(0)
    images = convert_from_bytes(pdf_file.read())
    ocr_text = ""
    for img in images:
        ocr_text += pytesseract.image_to_string(img, lang="kaz+rus+eng", config="--psm 6") + "\n"
    return ocr_text


# ==========================
# DRF VIEW
# ==========================
class PDFCheckView(APIView):
    def post(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get("pdf_file")
        if not uploaded_file:
            return Response({"error": "PDF не загружен"}, status=400)

        # Извлекаем текст
        text = extract_text_from_pdf(uploaded_file)

        result = {
            "case_numbers": extract_case_number(text),
            "main_accused": extract_main_accused(text),
            "birth_date": extract_birth_date(text)
        }

        return Response(result, status=200)
