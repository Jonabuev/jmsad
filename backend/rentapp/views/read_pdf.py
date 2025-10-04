import re
import traceback
from datetime import datetime

import pytesseract
from PyPDF2 import PdfReader
from pdf2image import convert_from_bytes
from PIL import Image

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from ..models import CustomUser, RentalComplaint, ComplaintReason
from rentapp.permissions1 import IsAdmin

# ==========================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# ==========================
def extract_case_number(text: str):
    return re.findall(r"№\s*[\d\-\/]{6,}", text)


def normalize_fio(fio: str) -> str:
    """
    Приведение ФИО к именительному падежу (русский и казахский).
    Учитывает пол для фамилий и отчеств, сохраняет казахские отчества на -ұлы и -қызы.
    """
    parts = fio.split()
    if len(parts) != 3:
        return fio

    first, last, patronymic = parts

    # Падежные окончания для русского языка
    russian_endings_male = [
        r"(а|у|ым|е|ого|ому|им|ом)$",  # мужские фамилии и имена
    ]
    russian_endings_female = [
        r"(ой|ую|ской|скую)$",  # женские фамилии
        r"(ы|е|у|ой|и|ю|ей|ь|ью)$",  # женские имена
    ]
    kazakh_endings = [
        r"(тің|нің|дің|ке|ге|ға|ті|ны|ді|те|да|де|пен|мен|тен|дан|ден)$",  # казахские падежи
    ]

    # Определяем пол по отчеству
    is_female = bool(re.search(r"(овна|евна|ична|ая|яя)$", patronymic, flags=re.IGNORECASE))
    is_kazakh_patron = bool(re.search(r"(ұлы|қызы)$", patronymic, flags=re.IGNORECASE))

    # Обработка фамилии
    if is_female:
        # Женские фамилии на -ова, -ева, -ина остаются без изменений
        if not re.search(r"(ова|ева|ина|ая|яя)$", last, flags=re.IGNORECASE):
            for end in russian_endings_female + kazakh_endings:
                last = re.sub(end, "", last, flags=re.IGNORECASE)
    else:
        # Мужские фамилии: убираем окончания, если не -ов, -ев, -ин
        if not re.search(r"(ов|ев|ин)$", last, flags=re.IGNORECASE):
            for end in russian_endings_male + kazakh_endings:
                last = re.sub(end, "", last, flags=re.IGNORECASE)

    # Обработка имени
    for end in (russian_endings_male if not is_female else russian_endings_female) + kazakh_endings:
        first = re.sub(end, "", first, flags=re.IGNORECASE)

    # Обработка отчества
    if not is_kazakh_patron and not re.search(r"(ович|евич|овна|евна|ична|ая|яя)$", patronymic, flags=re.IGNORECASE):
        for end in (russian_endings_male if not is_female else russian_endings_female) + kazakh_endings:
            patronymic = re.sub(end, "", patronymic, flags=re.IGNORECASE)

    return f"{first} {last} {patronymic}"
def extract_main_accused(text: str):
    keywords = [
        r"ПРИГОВОРИЛ",
        r"Ү\s*К\s*І\s*М\s*Е\s*Т\s*Т\s*І",
        r"ҮКІМ\s*ЕТТІ",
        r"CONVICTED"
    ]

    fio_pattern = re.compile(r"^[А-ЯЁA-ZӘІҢҒҮҰҚӨҺ][а-яёa-zәіңғүұқөһ]+$")
    patronymic_endings = (
        "вич", "вна", "ович", "евич", "ична",
        "улы", "ұлы", "қызы",
        "оглы", "огли", "zade",
        "ов", "ев", "ин", "ын", "ынов", "инов",
        "ский", "цкий", "ая", "яя"
    )
    extended_endings = patronymic_endings + tuple(e + "а" for e in patronymic_endings)

    found_fios = []

    for kw in keywords:
        kw_pattern = re.compile(kw, flags=re.IGNORECASE)
        for match in kw_pattern.finditer(text):
            start_pos = match.start()
            # Берём кусок текста после keyword
            after_text = text[start_pos + len(match.group()):]
            words = after_text.split()
            for i in range(len(words) - 2):
                w1, w2, w3 = words[i:i+3]
                if fio_pattern.match(w1) and fio_pattern.match(w2) and fio_pattern.match(w3):
                    if any(w3.lower().endswith(end) for end in extended_endings):
                        before = match.group()  # сам keyword
                        after = " ".join(words[i+3:i+15])
                        fio = normalize_fio(f"{w1} {w2} {w3}")
                        found_fios.append({
                            "fio": fio,
                            "before": before,
                            "after": after
                        })
                        break  # берём только первый ФИО после keyword

    # Уникальные ФИО
    unique = []
    seen = set()
    for f in found_fios:
        if f["fio"] not in seen:
            seen.add(f["fio"])
            unique.append(f)

    return unique if unique else None


def extract_birth_date(text: str):
    months = {
        "қаңтар": 1, "ақпан": 2, "наурыз": 3, "сәуір": 4,
        "мамыр": 5, "маусым": 6, "шілде": 7, "тамыз": 8,
        "қыркүйек": 9, "қазан": 10, "қараша": 11, "желтоқсан": 12,
        "января": 1, "февраля": 2, "марта": 3, "апреля": 4,
        "мая": 5, "июня": 6, "июля": 7, "августа": 8,
        "сентября": 9, "октября": 10, "ноября": 11, "декабря": 12,
        "january": 1, "february": 2, "march": 3, "april": 4,
        "may": 5, "june": 6, "july": 7, "august": 8,
        "september": 9, "october": 10, "november": 11, "december": 12,
    }

    context_words = r"(туған|туылған|туғаны|туғанда|года рождения|родился|уроженец|born)"

    # Паттерн для числовых дат после дефиса или пробела
    pattern_num = re.compile(
        r"[-\s]+(\d{1,2})[.\-](\d{1,2})[.\-](\d{4})\s*жылы?.{0,50}?"+context_words,
        flags=re.IGNORECASE | re.DOTALL
    )

    # Паттерн для словесных дат (казахский или русский месяц)
    pattern_word = re.compile(
        r"(\d{1,2})\s*([А-Яа-яёӘәІіҢңҒғҮүҰұҚқӨөҺһa-z]+)\s*(\d{4})\s*жылы?.{0,50}?"+context_words,
        flags=re.IGNORECASE | re.DOTALL
    )

    pattern_year_first = re.compile(
        r"(\d{4})\s*жылы\s*(\d{1,2})\s*([А-Яа-яёӘәІіҢңҒғҮүҰұҚқӨөҺһa-z]+)де?.{0,50}?"+context_words,
        flags=re.IGNORECASE | re.DOTALL
    )

    for pattern in [pattern_num, pattern_word, pattern_year_first]:
        match = pattern.search(text)
        if match:
            groups = match.groups()
            if pattern == pattern_num:
                day, month, year = groups[:3]
                return f"{int(day):02d}.{int(month):02d}.{year}"
            elif pattern == pattern_word:
                day, month_word, year = groups[:3]
                month_word = month_word.lower()
                if month_word in months:
                    month = months[month_word]
                    return f"{int(day):02d}.{month:02d}.{year}"
            elif pattern == pattern_year_first:
                year, day, month_word = groups[:3]
                month_word = month_word.lower()
                if month_word in months:
                    month = months[month_word]
                    return f"{int(day):02d}.{month:02d}.{year}"

    return None


def extract_text_from_pdf(pdf_file) -> str:
    text = ""
    try:
        reader = PdfReader(pdf_file)
        for page in reader.pages:
            text += page.extract_text() or ""
    except Exception as e:
        print(f"⚠️ PdfReader error: {e}")

    if text.strip():
        return text

    # OCR fallback
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

        text = extract_text_from_pdf(uploaded_file)

        result = {
            "case_numbers": [n.replace("№", "").strip() for n in extract_case_number(text)],
            "main_accused": extract_main_accused(text),  # список [{fio, before, after}]
            "birth_date": extract_birth_date(text) or "",
            "is_court_case": True,
        }

        return Response(result, status=200)


class CreateUserFromPDFView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, *args, **kwargs):
        user = request.user
        if not isinstance(user, CustomUser):
            return Response({"error": "User must be authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

        fio = request.data.get("fio")
        birth_date = request.data.get("birth_date")
        description = request.data.get("complaint_description")
        reason_ids = request.data.get("reason_ids", [])
        court_decision_score = request.data.get("court_decision_score")
        evidence = request.FILES.get("evidence")

        if not fio or not birth_date:
            return Response({"error": "fio и birth_date обязательны"}, status=400)

        try:
            birth_date_dt = datetime.strptime(birth_date, "%d.%m.%Y").date()
        except ValueError:
            return Response({"error": "Неверный формат даты, используйте ДД.ММ.ГГГГ"}, status=400)

        accused_user = CustomUser.objects.filter(
            username=fio,
            birth_date__year=birth_date_dt.year
        ).first()

        if not accused_user:
            accused_user = CustomUser.objects.create(
                username=fio,
                birth_date=birth_date_dt,
                is_from_pdf=True,
                role="tenant",
                type_identify="iin",
            )

        try:
            complaint = RentalComplaint.objects.create(
                complainant=request.user,
                accused=accused_user,
                description=description or "",
                status="reviewed",
                is_court_case=True,
                court_decision_score=court_decision_score,
                evidence=evidence,
            )
        except Exception as e:
            print("❌ ERROR creating complaint:", e)
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

        if reason_ids:
            complaint.reasons.set(ComplaintReason.objects.filter(id__in=reason_ids))

        return Response(
            {
                "message": "Пользователь и жалоба созданы/обновлены",
                "user_id": accused_user.id,
                "complaint_id": complaint.id,
            },
            status=201
        )
