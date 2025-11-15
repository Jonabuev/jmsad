from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from allauth.account.signals import user_signed_up
from django.core.validators import RegexValidator
from django.dispatch import receiver
from django.db.models.signals import post_save
import random
from PIL import Image
import os
from django.conf import settings
from rentapp.validators import validate_avatar_image, validate_image_file  # ✅ Валидация файлов

def user_avatar_upload_path(instance, filename):
    # Используем ID пользователя. Можно заменить на UUID, если у тебя есть поле UUID.
    user_id = str(instance.id) or 'anonymous'
    ext = filename.split('.')[-1]
    filename = f"avatar.{ext}"
    return os.path.join('avatars', user_id, filename)

class CustomUser(AbstractUser):
    # ROLE_CHOICES = (
    #     ('landlord', 'Landlord'),
    #     ('tenant', 'Tenant'),
    # )
    type_chose = (
        ('individual', 'Individual'),
        ('legal_entity', 'Legal Entity'),
    )
    type_chose1 = (
    ('iin', 'ИИН'),
    ('bin', 'БИН'),
    )
    DOCUMENT_TYPES = (
    ('id_card', 'ID Card'),
    ('passport_kz', 'KZ Passport'),
    ('visa', 'Visa'),
    )
    
    COUNTRY_CHOICES = [
        ("AD", "Andorra"),
        ("AE", "United Arab Emirates"),
        ("AF", "Afghanistan"),
        ("AG", "Antigua and Barbuda"),
        ("AI", "Anguilla"),
        ("AL", "Albania"),
        ("AM", "Armenia"),
        ("AO", "Angola"),
        ("AQ", "Antarctica"),
        ("AR", "Argentina"),
        ("AS", "American Samoa"),
        ("AT", "Austria"),
        ("AU", "Australia"),
        ("AW", "Aruba"),
        ("AX", "Åland Islands"),
        ("AZ", "Azerbaijan"),
        ("BA", "Bosnia and Herzegovina"),
        ("BB", "Barbados"),
        ("BD", "Bangladesh"),
        ("BE", "Belgium"),
        ("BF", "Burkina Faso"),
        ("BG", "Bulgaria"),
        ("BH", "Bahrain"),
        ("BI", "Burundi"),
        ("BJ", "Benin"),
        ("BL", "Saint Barthélemy"),
        ("BM", "Bermuda"),
        ("BN", "Brunei Darussalam"),
        ("BO", "Bolivia"),
        ("BQ", "Bonaire, Sint Eustatius and Saba"),
        ("BR", "Brazil"),
        ("BS", "Bahamas"),
        ("BT", "Bhutan"),
        ("BV", "Bouvet Island"),
        ("BW", "Botswana"),
        ("BY", "Belarus"),
        ("BZ", "Belize"),
        ("CA", "Canada"),
        ("CC", "Cocos (Keeling) Islands"),
        ("CD", "Congo, Democratic Republic of the"),
        ("CF", "Central African Republic"),
        ("CG", "Congo"),
        ("CH", "Switzerland"),
        ("CI", "Côte d'Ivoire"),
        ("CK", "Cook Islands"),
        ("CL", "Chile"),
        ("CM", "Cameroon"),
        ("CN", "China"),
        ("CO", "Colombia"),
        ("CR", "Costa Rica"),
        ("CU", "Cuba"),
        ("CV", "Cabo Verde"),
        ("CW", "Curaçao"),
        ("CX", "Christmas Island"),
        ("CY", "Cyprus"),
        ("CZ", "Czech Republic"),
        ("DE", "Germany"),
        ("DJ", "Djibouti"),
        ("DK", "Denmark"),
        ("DM", "Dominica"),
        ("DO", "Dominican Republic"),
        ("DZ", "Algeria"),
        ("EC", "Ecuador"),
        ("EE", "Estonia"),
        ("EG", "Egypt"),
        ("EH", "Western Sahara"),
        ("ER", "Eritrea"),
        ("ES", "Spain"),
        ("ET", "Ethiopia"),
        ("FI", "Finland"),
        ("FJ", "Fiji"),
        ("FK", "Falkland Islands (Malvinas)"),
        ("FM", "Micronesia, Federated States of"),
        ("FO", "Faroe Islands"),
        ("FR", "France"),
        ("GA", "Gabon"),
        ("GB", "United Kingdom"),
        ("GD", "Grenada"),
        ("GE", "Georgia"),
        ("GF", "French Guiana"),
        ("GG", "Guernsey"),
        ("GH", "Ghana"),
        ("GI", "Gibraltar"),
        ("GL", "Greenland"),
        ("GM", "Gambia"),
        ("GN", "Guinea"),
        ("GP", "Guadeloupe"),
        ("GQ", "Equatorial Guinea"),
        ("GR", "Greece"),
        ("GS", "South Georgia and the South Sandwich Islands"),
        ("GT", "Guatemala"),
        ("GU", "Guam"),
        ("GW", "Guinea-Bissau"),
        ("GY", "Guyana"),
        ("HK", "Hong Kong"),
        ("HM", "Heard Island and McDonald Islands"),
        ("HN", "Honduras"),
        ("HR", "Croatia"),
        ("HT", "Haiti"),
        ("HU", "Hungary"),
        ("ID", "Indonesia"),
        ("IE", "Ireland"),
        ("IL", "Israel"),
        ("IM", "Isle of Man"),
        ("IN", "India"),
        ("IO", "British Indian Ocean Territory"),
        ("IQ", "Iraq"),
        ("IR", "Iran"),
        ("IS", "Iceland"),
        ("IT", "Italy"),
        ("JE", "Jersey"),
        ("JM", "Jamaica"),
        ("JO", "Jordan"),
        ("JP", "Japan"),
        ("KE", "Kenya"),
        ("KG", "Kyrgyzstan"),
        ("KH", "Cambodia"),
        ("KI", "Kiribati"),
        ("KM", "Comoros"),
        ("KN", "Saint Kitts and Nevis"),
        ("KP", "North Korea"),
        ("KR", "South Korea"),
        ("KW", "Kuwait"),
        ("KY", "Cayman Islands"),
        ("KZ", "Kazakhstan"),
        ("LA", "Laos"),
        ("LB", "Lebanon"),
        ("LC", "Saint Lucia"),
        ("LI", "Liechtenstein"),
        ("LK", "Sri Lanka"),
        ("LR", "Liberia"),
        ("LS", "Lesotho"),
        ("LT", "Lithuania"),
        ("LU", "Luxembourg"),
        ("LV", "Latvia"),
        ("LY", "Libya"),
        ("MA", "Morocco"),
        ("MC", "Monaco"),
        ("MD", "Moldova"),
        ("ME", "Montenegro"),
        ("MF", "Saint Martin (French part)"),
        ("MG", "Madagascar"),
        ("MH", "Marshall Islands"),
        ("MK", "North Macedonia"),
        ("ML", "Mali"),
        ("MM", "Myanmar"),
        ("MN", "Mongolia"),
        ("MO", "Macao"),
        ("MP", "Northern Mariana Islands"),
        ("MQ", "Martinique"),
        ("MR", "Mauritania"),
        ("MS", "Montserrat"),
        ("MT", "Malta"),
        ("MU", "Mauritius"),
        ("MV", "Maldives"),
        ("MW", "Malawi"),
        ("MX", "Mexico"),
        ("MY", "Malaysia"),
        ("MZ", "Mozambique"),
        ("NA", "Namibia"),
        ("NC", "New Caledonia"),
        ("NE", "Niger"),
        ("NF", "Norfolk Island"),
        ("NG", "Nigeria"),
        ("NI", "Nicaragua"),
        ("NL", "Netherlands"),
        ("NO", "Norway"),
        ("NP", "Nepal"),
        ("NR", "Nauru"),
        ("NU", "Niue"),
        ("NZ", "New Zealand"),
        ("OM", "Oman"),
        ("PA", "Panama"),
        ("PE", "Peru"),
        ("PF", "French Polynesia"),
        ("PG", "Papua New Guinea"),
        ("PH", "Philippines"),
        ("PK", "Pakistan"),
        ("PL", "Poland"),
        ("PM", "Saint Pierre and Miquelon"),
        ("PN", "Pitcairn"),
        ("PR", "Puerto Rico"),
        ("PS", "Palestine"),
        ("PT", "Portugal"),
        ("PW", "Palau"),
        ("PY", "Paraguay"),
        ("QA", "Qatar"),
        ("RE", "Réunion"),
        ("RO", "Romania"),
        ("RS", "Serbia"),
        ("RU", "Russia"),
        ("RW", "Rwanda"),
        ("SA", "Saudi Arabia"),
        ("SB", "Solomon Islands"),
        ("SC", "Seychelles"),
        ("SD", "Sudan"),
        ("SE", "Sweden"),
        ("SG", "Singapore"),
        ("SH", "Saint Helena, Ascension and Tristan da Cunha"),
        ("SI", "Slovenia"),
        ("SJ", "Svalbard and Jan Mayen"),
        ("SK", "Slovakia"),
        ("SL", "Sierra Leone"),
        ("SM", "San Marino"),
        ("SN", "Senegal"),
        ("SO", "Somalia"),
        ("SR", "Suriname"),
        ("SS", "South Sudan"),
        ("ST", "Sao Tome and Principe"),
        ("SV", "El Salvador"),
        ("SX", "Sint Maarten (Dutch part)"),
        ("SY", "Syria"),
        ("SZ", "Eswatini"),
        ("TC", "Turks and Caicos Islands"),
        ("TD", "Chad"),
        ("TF", "French Southern Territories"),
        ("TG", "Togo"),
        ("TH", "Thailand"),
        ("TJ", "Tajikistan"),
        ("TK", "Tokelau"),
        ("TL", "Timor-Leste"),
        ("TM", "Turkmenistan"),
        ("TN", "Tunisia"),
        ("TO", "Tonga"),
        ("TR", "Turkey"),
        ("TT", "Trinidad and Tobago"),
        ("TV", "Tuvalu"),
        ("TW", "Taiwan"),
        ("TZ", "Tanzania"),
        ("UA", "Ukraine"),
        ("UG", "Uganda"),
        ("UM", "United States Minor Outlying Islands"),
        ("US", "United States"),
        ("UY", "Uruguay"),
        ("UZ", "Uzbekistan"),
        ("VA", "Holy See"),
        ("VC", "Saint Vincent and the Grenadines"),
        ("VE", "Venezuela"),
        ("VG", "Virgin Islands (British)"),
        ("VI", "Virgin Islands (U.S.)"),
        ("VN", "Vietnam"),
        ("VU", "Vanuatu"),
        ("WF", "Wallis and Futuna"),
        ("WS", "Samoa"),
        ("YE", "Yemen"),
        ("YT", "Mayotte"),
        ("ZA", "South Africa"),
        ("ZM", "Zambia"),
        ("ZW", "Zimbabwe"),
    ]

    # Списки для генерации анонимных имен
    ANONYMOUS_ADJECTIVES = [
        'Тихий', 'Веселый', 'Серьезный', 'Дружелюбный', 'Спокойный', 'Активный', 
        'Умный', 'Творческий', 'Надежный', 'Ответственный', 'Вежливый', 'Оптимистичный',
        'Скромный', 'Энергичный', 'Терпеливый', 'Добрый', 'Честный', 'Смелый',
        'Заботливый', 'Трудолюбивый', 'Любознательный', 'Справедливый', 'Щедрый',
        'Скромный', 'Смешной', 'Мудрый', 'Быстрый', 'Сильный', 'Гибкий', 'Устойчивый'
    ]
    
    ANONYMOUS_NOUNS = [
        'Сосед', 'Житель', 'Арендатор', 'Арендодатель', 'Пользователь', 'Клиент',
        'Гость', 'Хозяин', 'Квартирант', 'Владелец', 'Постоялец', 'Резидент',
        'Обитатель', 'Насельник', 'Квартиросъемщик', 'Домовладелец', 'Арендатор',
        'Постоялец', 'Жилец', 'Квартирант', 'Съемщик', 'Хозяин', 'Владелец',
        'Арендодатель', 'Квартиросъемщик', 'Постоялец', 'Житель', 'Сосед'
    ]
    
    ANONYMOUS_COLORS = [
        'Красный', 'Синий', 'Зеленый', 'Желтый', 'Оранжевый', 'Фиолетовый', 
        'Розовый', 'Коричневый', 'Серый', 'Черный', 'Белый', 'Голубой',
        'Бирюзовый', 'Малиновый', 'Золотой', 'Серебряный', 'Бронзовый', 'Медный',
        'Изумрудный', 'Сапфировый', 'Рубиновый', 'Аметистовый', 'Топазовый'
    ]
    
    ANONYMOUS_ANIMALS = [
        'Кот', 'Пес', 'Лев', 'Тигр', 'Медведь', 'Волк', 'Лиса', 'Заяц', 'Еж',
        'Белка', 'Олень', 'Лось', 'Кабан', 'Косуля', 'Кролик', 'Хомяк', 'Мышь',
        'Бобр', 'Сокол', 'Орел', 'Лебедь', 'Журавль', 'Фазан', 'Павлин'
    ]

    citizenship = models.CharField(
        max_length=2,  # Длина кода страны (2 символа для ISO 3166-1 alpha-2)
        choices=COUNTRY_CHOICES,
        blank=True,
        null=True,
    )
    passport_expiry = models.DateField(null=True, blank=True)  # для id/pаспорта/визы
    visa_number = models.CharField(max_length=50, null=True, blank=True)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, blank=True, null=True)
    username = models.CharField(max_length=150, unique=True, validators=[RegexValidator(r'^[\w\s]+$', 'Username can contain letters, numbers, and spaces only.')])
    role = models.CharField(max_length=20, null=True, blank=True, default="user")
    thirdname = models.CharField(max_length=20, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)  
    email_confirmed = models.BooleanField(default=False)
    phone_confirmed = models.BooleanField(default=False)
    type_entity = models.CharField(max_length=30, choices=type_chose, default='individual')
    type_identify = models.CharField(max_length=12, choices=type_chose1)
    documents = models.JSONField(default=dict, blank=True, null=True)
    identifier = models.CharField(max_length=15, blank=True, null=True, unique=True)  
    confirmation_code = models.CharField(max_length=6, blank=True, null=True)
    #rating = models.PositiveSmallIntegerField(default=5)
    avatar = models.ImageField(
        upload_to=user_avatar_upload_path, 
        blank=True, 
        null=True, 
        default='avatars/def.jpg',
        validators=[validate_avatar_image]  # ✅ Валидация аватара (макс 5MB, только jpg/png)
    )
    r_date = models.DateTimeField(null=True)
    birth_date = models.DateField(null=True, blank=True)
    is_from_pdf = models.BooleanField(default=False)
    anonymous_name = models.CharField(max_length=100, blank=True, null=True, unique=True)
    is_banned = models.BooleanField(default=False, help_text="Whether the user is banned")

    def generate_confirmation_code(self):
        self.confirmation_code = str(random.randint(100000, 999999))
        self.save()
    
    def check_violation_block_status(self):
        from rentapp.models import BlacklistEntry

        active_violations = self.violations.filter(active=True).count()
        is_blocked = hasattr(self, 'blacklist')

        if active_violations >= 3:
            if not is_blocked:
                BlacklistEntry.objects.create(user=self, reason="violation")
        else:
            if is_blocked and self.blacklist.reason == "violation":
                self.blacklist.delete()

    def generate_anonymous_name(self):
        """Генерирует случайное анонимное имя для пользователя"""
        # Выбираем случайные элементы из списков
        adjective = random.choice(self.ANONYMOUS_ADJECTIVES)
        noun = random.choice(self.ANONYMOUS_NOUNS)
        color = random.choice(self.ANONYMOUS_COLORS)
        animal = random.choice(self.ANONYMOUS_ANIMALS)
        
        # Создаем несколько вариантов анонимных имен
        name_variants = [
            f"{adjective} {noun}",
            f"{color} {animal}",
            f"{adjective} {color} {noun}",
            f"{noun} {animal}",
            f"{adjective} {animal}",
            f"{color} {noun}",
            f"{adjective} {noun} {animal}",
            f"{color} {adjective} {noun}"
        ]
        
        # Выбираем случайный вариант
        anonymous_name = random.choice(name_variants)
        
        # Проверяем, что такое имя еще не используется
        counter = 1
        original_name = anonymous_name
        while CustomUser.objects.filter(anonymous_name=anonymous_name).exists():
            anonymous_name = f"{original_name} {counter}"
            counter += 1
            if counter > 100:  # Защита от бесконечного цикла
                break
        
        return anonymous_name
    
    def save(self, *args, **kwargs):
        # ✅ Автоматическая логика для superuser
        if self.is_superuser:
            self.email_confirmed = True

        # ✅ Автообработка типа сущности и документов
        if self.type_entity != 'legal_entity':
            self.documents = {}
            self.type_identify = 'iin'
        elif self.type_entity == 'legal_entity':
            self.type_identify = 'bin'
        
        # ✅ Генерация анонимного имени, если нет
        if not self.anonymous_name:
            self.anonymous_name = self.generate_anonymous_name()

        # ✅ Оптимизация аватара
        if self.avatar and hasattr(self.avatar, 'file'):
            try:
                if self.pk:
                    try:
                        original = CustomUser.objects.get(pk=self.pk)
                        if original.avatar != self.avatar:
                            from .utils.image_optimization import optimize_avatar
                            self.avatar = optimize_avatar(self.avatar)
                    except CustomUser.DoesNotExist:
                        pass
                else:
                    from .utils.image_optimization import optimize_avatar
                    self.avatar = optimize_avatar(self.avatar)
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Не удалось оптимизировать аватар: {e}")

        super().save(*args, **kwargs)

    def get_avatar_url(self):
        if self.avatar and hasattr(self.avatar, 'url'):
            return self.avatar.url
        return '/media/avatars/def.jpg'

    def __str__(self):
        return self.username
    

import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

class PasswordChangeRequest(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        return self.created_at + timedelta(minutes=10) < timezone.now()


from .models import CustomUser
import os

def user_id_document_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f'id_document.{ext}'
    return os.path.join(f'id_documents/{instance.user.id}', filename)

class IdentityVerification(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    id_document = models.FileField(upload_to=user_id_document_upload_path)
    verified = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username



@receiver(user_signed_up)
def create_custom_user_on_signup(request, user, **kwargs):
    if not CustomUser.objects.filter(id=user.id).exists():
        CustomUser.objects.create(user=user)


from django.db import models
from django.utils import timezone
import requests

import requests
from django.db import models
from django.utils import timezone
import time
import requests
from django.db import models
from django.utils import timezone
import requests

import time
import requests
from django.db import models
from django.utils import timezone

class House(models.Model):
    PROPERTY_TYPE_CHOICES = (
        ('apartment', 'Квартира'),
        ('house', 'Дом'),
        ('room', 'Комната'),
    )

    id = models.AutoField(primary_key=True)
    owner = models.ForeignKey('CustomUser', on_delete=models.CASCADE, related_name='houses')
    
    # Основное поле адреса (оставляем для обратной совместимости)
    address = models.CharField(max_length=255)
    
    # Иерархические поля адреса
    street = models.CharField(max_length=255, verbose_name="Улица", null=True, blank=True)
    microdistrict = models.CharField(max_length=255, verbose_name="Микрорайон", null=True, blank=True)
    district = models.CharField(max_length=255, verbose_name="Район", null=True, blank=True)
    city = models.CharField(max_length=255, verbose_name="Город", null=True, blank=True)
    region = models.CharField(max_length=255, verbose_name="Область", null=True, blank=True)

    description = models.TextField(verbose_name="Описание", blank=True, null=True)
    area = models.FloatField(verbose_name="Площадь (м²)", blank=True, null=True)
    floor = models.IntegerField(verbose_name="Этаж", blank=True, null=True)
    total_floors = models.IntegerField(verbose_name="Этажность дома", blank=True, null=True)
    year_built = models.IntegerField(verbose_name="Год постройки", blank=True, null=True)
    is_furnished = models.BooleanField(verbose_name="Меблировка", default=False)
    has_balcony = models.BooleanField(verbose_name="Балкон", default=False)
    
    
    # Остальные поля
    type_p = models.CharField(max_length=20, choices=PROPERTY_TYPE_CHOICES)
    num_of_rooms = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(default=timezone.now)
    comment = models.TextField(blank=True, null=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Если address заполнен, получаем координаты и компоненты адреса
        if self.address:
            lat, lon, region, city, district, street, microdistrict = self.get_coordinates(self.address)
            self.latitude = lat
            self.longitude = lon
            self.region = region
            self.city = city
            self.district = district
            self.street = street
            self.microdistrict = microdistrict
        super().save(*args, **kwargs)

    def get_coordinates(self, address):
        API_KEY = "c2b5bfe1-4f8f-4d16-baa8-2c2aa6c94384"
        url = f"https://geocode-maps.yandex.ru/1.x/?apikey={API_KEY}&geocode={address}&format=json&lang=ru_RU"
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'http://localhost:8000'
        }
        response = requests.get(url, headers=headers, timeout=10)
        data = response.json()
        features = data['response']['GeoObjectCollection']['featureMember']
        if not features:
            return None, None, None, None, None, None, None
        geo_obj = features[0]['GeoObject']
        pos = geo_obj['Point']['pos']
        lon, lat = map(float, pos.split())
        components = geo_obj['metaDataProperty']['GeocoderMetaData']['Address']['Components']
        region = city = district = street = microdistrict = complex_name = None
        for comp in components:
            kind = comp.get("kind")
            name = comp.get("name")
            if kind == "province":
                region = name
            elif kind == "locality":
                city = name
            elif kind in ("district", "area"):
                district = name
            elif kind == "street":
                street = name
            elif kind == "other":
                if "мкр" in name.lower():
                    microdistrict = name
                elif "жк" in name.lower():
                    complex_name = name
        # Если микрорайон не найден, но есть ЖК — используем ЖК
        if not microdistrict and complex_name:
            microdistrict = complex_name
        return lat, lon, region, city, district, street, microdistrict
    def __str__(self):
        return f'{self.type_p} at {self.address}'


def house_image_upload_path(instance, filename):
    # Получаем расширение файла
    ext = os.path.splitext(filename)[1]
    
    # Считаем, сколько изображений уже есть у этого дома
    count = instance.house.images.count() + 1  # +1 для нового изображения

    # Имя файла будет photo_1.jpg, photo_2.png, ...
    filename = f'photo_{count}{ext}'

    return f'house_images/{instance.house.id}/{filename}'

class HouseImage(models.Model):
    house = models.ForeignKey('House', on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(
        upload_to=house_image_upload_path,
        validators=[validate_image_file]  # ✅ Валидация изображений (макс 10MB)
    )
    description = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Image for {self.house.address}"


class ComplaintReason(models.Model):
    TENANT = 'tenant'
    LANDLORD = 'landlord'

    REASON_TYPE_CHOICES = [
        (TENANT, 'Tenant'),
        (LANDLORD, 'Landlord'),
    ]

    reason = models.CharField(max_length=255, unique=True)
    reason_kz = models.CharField(max_length=255, blank=True, null=True, verbose_name="Причина (KZ)")
    reason_en = models.CharField(max_length=255, blank=True, null=True, verbose_name="Причина (EN)")
    type = models.CharField(max_length=20, choices=REASON_TYPE_CHOICES, default='')
    is_default = models.BooleanField(default=False, help_text="Является ли причина дефолтной")
    order = models.PositiveIntegerField(default=0, help_text="Порядок отображения")

    class Meta:
        ordering = ['type', 'order', 'reason']
        verbose_name = "Причина жалобы"
        verbose_name_plural = "Причины жалоб"

    def __str__(self):
        return f"{self.reason} ({self.get_type_display()})"
    
    @classmethod
    def get_default_reasons_for_type(cls, reason_type):
        """Получить дефолтные причины для определенного типа"""
        return cls.objects.filter(type=reason_type, is_default=True).order_by('order')
    
    @classmethod
    def ensure_default_reasons_exist(cls):
        """Убедиться, что дефолтные причины существуют с переводами"""
        # Причины для жалоб на арендодателей (от арендаторов)
        # Формат: (ru, kz, en)
        landlord_reasons = [
            ("Отсутствие ремонта помещения", "Үй-жайды жөндеу жоқ", "Lack of property repair"),
            ("Повышение арендной платы без уведомления", "Хабарлаусыз жалдау ақысын арттыру", "Rent increase without notice"), 
            ("Нарушение условий договора", "Шарт талаптарын бұзу", "Contract violation"),
            ("Игнорирование заявок на устранение неисправностей", "Ақауларды жою өтінімдерін елемеу", "Ignoring repair requests"),
            ("Отказ от предоставления документов на жилье", "Тұрғын үйге құжаттарды беруден бас тарту", "Refusal to provide property documents")
        ]
        
        # Причины для жалоб на арендаторов (от арендодателей)
        tenant_reasons = [
            ("Просрочка платежей", "Төлемдерді кешіктіру", "Late payments"),
            ("Порча имущества", "Мүлікті бүлдіру", "Property damage"),
            ("Нарушение условий договора", "Шарт талаптарын бұзу", "Contract violation"),
            ("Жалобы от соседей / нарушение порядка", "Көршілерден шағымдар / тәртіпті бұзу", "Neighbor complaints / disturbance"),
            ("Самовольное выселение или отказ освободить помещение", "Өз еркімен шығару немесе үй-жайды босатудан бас тарту", "Unlawful eviction or refusal to vacate")
        ]
        
        # Создаем причины для арендодателей
        for i, (reason_ru, reason_kz, reason_en) in enumerate(landlord_reasons):
            obj, created = cls.objects.get_or_create(
                reason=reason_ru,
                defaults={
                    'reason_kz': reason_kz,
                    'reason_en': reason_en,
                    'type': 'landlord',
                    'is_default': True,
                    'order': i
                }
            )
            # Обновляем переводы если запись уже существует
            if not created and (not obj.reason_kz or not obj.reason_en):
                obj.reason_kz = reason_kz
                obj.reason_en = reason_en
                obj.save()
        
        # Создаем причины для арендаторов
        for i, (reason_ru, reason_kz, reason_en) in enumerate(tenant_reasons):
            obj, created = cls.objects.get_or_create(
                reason=reason_ru,
                defaults={
                    'reason_kz': reason_kz,
                    'reason_en': reason_en,
                    'type': 'tenant',
                    'is_default': True,
                    'order': i
                }
            )
            # Обновляем переводы если запись уже существует
            if not created and (not obj.reason_kz or not obj.reason_en):
                obj.reason_kz = reason_kz
                obj.reason_en = reason_en
                obj.save()
    
import uuid
from django.db import models
from django.utils import timezone
from .models import House, CustomUser, ComplaintReason

class Complaint(models.Model):
    COMPLAINT_REASON_CHOICES = (
        ('neighbor_complaint', 'Жалобы соседей'),
        ('contract_violation', 'Нарушение контракта'),
        ('property_damage', 'Урон недвижимости'),
        ('payment_delay', 'Задержка оплаты'),
    )

    STATUS_CHOICES = (
        ('pending', 'Проверяется'),
        ('reviewed', 'Проверено'),
        ('rejected', 'Отклонено'),
    )

    id = models.AutoField(primary_key=True)
    property = models.ForeignKey(House, on_delete=models.CASCADE)
    tenant_identity = models.ForeignKey(
        CustomUser,
        related_name='tenant_identity',
        on_delete=models.CASCADE,
        null=True,
        blank=True  # 👈 важно!
    )
    landlord_identity = models.ForeignKey(
        CustomUser,
        related_name='landlord_identity',
        on_delete=models.CASCADE
    )
    reasons = models.ManyToManyField(ComplaintReason)
    description = models.TextField()
    evidence = models.FileField(upload_to='evidence/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    support_count = models.IntegerField(default=0)
    #rating = models.PositiveSmallIntegerField(default=3)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def __str__(self):
        return f'Complaint for {self.property.address} - {self.get_status_display()}'

        
class Reputation(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    id = models.AutoField(primary_key=True)  
    tenant_identifier = models.ForeignKey(CustomUser, related_name='tenant_reputation', on_delete=models.CASCADE)  
    author_identifier = models.ForeignKey(CustomUser, related_name='author_reputation', on_delete=models.CASCADE)  
    rating = models.PositiveSmallIntegerField() 
    comment = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')  
    created_at = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        if self.rating < 1 or self.rating > 5:
            raise ValueError('Rating must be between 1 and 5')
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Reputation by {self.author_identifier.username} - {self.rating} Stars'


class Review(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    id = models.AutoField(primary_key=True)  
    tenant_identifier = models.ForeignKey(IdentityVerification, related_name='tenant_reviews', on_delete=models.CASCADE)
    author_identifier = models.ForeignKey(CustomUser, related_name='author_reviews', on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField()  
    comment = models.TextField(blank=True, null=True)  
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)  

    def __str__(self):
        return f'Review by {self.author_identifier.username} on {self.tenant_identifier.user.username}'

    def save(self, *args, **kwargs):
        if not (1 <= self.rating <= 5):
            raise ValueError("Rating must be between 1 and 5")
        super().save(*args, **kwargs)


class ModerationLog(models.Model):
    ACTION_CHOICES = (
        ('approve_complaint', 'Approve Complaint'),
        ('reject_complaint', 'Reject Complaint'),
        ('delete_review', 'Delete Review'),
        ('ban_user', 'Ban User'),
    )

    id = models.AutoField(primary_key=True)  
    admin_identifier = models.ForeignKey(IdentityVerification, related_name='admin_logs', on_delete=models.CASCADE)  
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, null=False)  
    target_id = models.IntegerField()  
    details = models.TextField(blank=True, null=True)  
    created_at = models.DateTimeField(default=timezone.now)  

    def __str__(self):
        return f'{self.action} by {self.admin_identifier.user.username} on target {self.target_id}'


class FalseReport(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected'),
    )

    id = models.AutoField(primary_key=True)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE)  
    tenant_identifier = models.ForeignKey(IdentityVerification, on_delete=models.CASCADE)  
    reason = models.TextField()  
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending') 
    created_at = models.DateTimeField(default=timezone.now)  

    def __str__(self):
        return f'False Report by {self.tenant_identifier.user.username} on Complaint {self.complaint.id}'

class OccupiedProperty(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('terminated', 'Terminated'),
    )

    id = models.AutoField(primary_key=True) 
    property = models.ForeignKey(House, on_delete=models.CASCADE)  
    tenant_identifier = models.ForeignKey(IdentityVerification, on_delete=models.CASCADE)  
    start_date = models.DateField()
    end_date = models.DateField() 
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(default=timezone.now) 

    def clean(self):
        if self.end_date <= self.start_date:
            raise ValidationError("End date must be after start date.")

    def __str__(self):
        return f'Property {self.property.id} occupied by {self.tenant_identifier.user.username}'




class Rental(models.Model):
    STATUS_CHOICES = [
        ('active', 'Активная'),
        ('pending', 'Ожидает подтверждения'),
        ('ended', 'Завершена'),
        ('declined', 'Отклонена'),
        ('cancelled', 'Отменена'),
    ]

    house = models.ForeignKey(House, on_delete=models.CASCADE)
    tenant = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='rentals')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_paid = models.BooleanField(default=False)




class Favorite(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='favorites')
    house = models.ForeignKey(House, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

class ChatThread(models.Model):
    house = models.ForeignKey(House, on_delete=models.CASCADE)
    tenant = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='chat_tenants')
    landlord = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='chat_landlords')
    created_at = models.DateTimeField(auto_now_add=True)

class ChatMessage(models.Model):
    thread = models.ForeignKey(ChatThread, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        # Жалобы
        ('complaint_received', 'Получена жалоба'),
        ('complaint_status_updated', 'Обновлен статус жалобы'),
        ('complaint_supported', 'Жалоба поддержана'),
        ('complaint_commented', 'Новый комментарий к жалобе'),
        
        # Аренда
        ('rental_confirmed', 'Аренда подтверждена'),
        ('rental_rejected', 'Аренда отклонена'),
        ('rental_request_received', 'Получена заявка на аренду'),
        ('rental_starting_soon', 'Аренда скоро начнется'),
        ('rental_ending_soon', 'Аренда скоро закончится'),
        
        # Пользователи
        ('user_verified', 'Аккаунт верифицирован'),
        ('user_banned', 'Аккаунт заблокирован'),
        ('user_unbanned', 'Аккаунт разблокирован'),
        ('profile_updated', 'Профиль обновлен'),
        
        # Системные
        ('system_maintenance', 'Техническое обслуживание'),
        ('system_update', 'Обновление системы'),
        ('security_alert', 'Предупреждение безопасности'),
        
        # Новые возможности
        ('new_feature', 'Новая функция'),
        ('promotion', 'Акция'),
        ('reminder', 'Напоминание'),
    )

    PRIORITY_CHOICES = (
        ('low', 'Низкий'),
        ('normal', 'Обычный'),
        ('high', 'Высокий'),
        ('urgent', 'Срочный'),
    )

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default='complaint_received')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    title = models.CharField(max_length=255, default='Уведомление')
    message = models.TextField()
    
    # Связанные объекты
    related_complaint = models.ForeignKey('RentalComplaint', on_delete=models.CASCADE, null=True, blank=True)
    related_rental = models.ForeignKey('Rental', on_delete=models.CASCADE, null=True, blank=True)
    related_house = models.ForeignKey('House', on_delete=models.CASCADE, null=True, blank=True)
    
    # Статус и настройки
    is_read = models.BooleanField(default=False)
    is_email_sent = models.BooleanField(default=False)
    is_sms_sent = models.BooleanField(default=False)
    is_push_sent = models.BooleanField(default=False)
    
    # Метаданные
    metadata = models.JSONField(default=dict, blank=True)
    action_url = models.URLField(null=True, blank=True, help_text="Ссылка для действия")
    expires_at = models.DateTimeField(null=True, blank=True, help_text="Время истечения уведомления")
    
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['type', 'created_at']),
            models.Index(fields=['priority', 'created_at']),
        ]

    def __str__(self):
        return f'{self.type} - {self.user.username}'

    def mark_as_read(self):
        """Отметить уведомление как прочитанное"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()

    def is_expired(self):
        """Проверить, истекло ли уведомление"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False


class NotificationSettings(models.Model):
    """Настройки уведомлений пользователя"""
    
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='notification_settings')
    
    # Email уведомления
    email_enabled = models.BooleanField(default=True, verbose_name="Email уведомления включены")
    email_complaints = models.BooleanField(default=True, verbose_name="Email о жалобах")
    email_rentals = models.BooleanField(default=True, verbose_name="Email об аренде")
    email_system = models.BooleanField(default=True, verbose_name="Email системные")
    email_promotions = models.BooleanField(default=False, verbose_name="Email промо")
    
    # Push уведомления
    push_enabled = models.BooleanField(default=True, verbose_name="Push уведомления включены")
    push_complaints = models.BooleanField(default=True, verbose_name="Push о жалобах")
    push_rentals = models.BooleanField(default=True, verbose_name="Push об аренде")
    push_system = models.BooleanField(default=True, verbose_name="Push системные")
    push_promotions = models.BooleanField(default=False, verbose_name="Push промо")
    
    # SMS уведомления
    sms_enabled = models.BooleanField(default=False, verbose_name="SMS уведомления включены")
    sms_urgent_only = models.BooleanField(default=True, verbose_name="SMS только срочные")
    phone_number = models.CharField(max_length=20, blank=True, verbose_name="Номер телефона")
    
    # Время уведомлений
    quiet_hours_start = models.TimeField(default='22:00', verbose_name="Начало тихих часов")
    quiet_hours_end = models.TimeField(default='08:00', verbose_name="Конец тихих часов")
    timezone = models.CharField(max_length=50, default='Asia/Almaty', verbose_name="Часовой пояс")
    
    # Частота уведомлений
    digest_frequency = models.CharField(
        max_length=20,
        choices=[
            ('none', 'Не отправлять'),
            ('daily', 'Ежедневно'),
            ('weekly', 'Еженедельно'),
        ],
        default='none',
        verbose_name="Частота дайджеста"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Настройки уведомлений"
        verbose_name_plural = "Настройки уведомлений"

    def __str__(self):
        return f"Настройки уведомлений - {self.user.username}"

    def should_send_notification(self, notification_type, priority='normal'):
        """Проверить, нужно ли отправлять уведомление"""
        # Проверяем время (тихие часы)
        from datetime import datetime, time
        now = datetime.now().time()
        
        # Преобразуем строки времени в объекты time, если они еще не преобразованы
        start_time = self.quiet_hours_start
        end_time = self.quiet_hours_end
        
        if isinstance(start_time, str):
            start_time = datetime.strptime(start_time, '%H:%M').time()
        if isinstance(end_time, str):
            end_time = datetime.strptime(end_time, '%H:%M').time()
        
        if start_time <= end_time:
            # Обычные часы (например, 22:00 - 08:00)
            if start_time <= now <= end_time:
                return False
        else:
            # Переход через полночь (например, 22:00 - 08:00)
            if now >= start_time or now <= end_time:
                return False
        
        # Проверяем настройки по типу уведомления
        if notification_type.startswith('complaint'):
            return self.email_complaints if notification_type.endswith('_email') else self.push_complaints
        elif notification_type.startswith('rental'):
            return self.email_rentals if notification_type.endswith('_email') else self.push_rentals
        elif notification_type in ['system_maintenance', 'system_update', 'security_alert']:
            return self.email_system if notification_type.endswith('_email') else self.push_system
        elif notification_type in ['new_feature', 'promotion']:
            return self.email_promotions if notification_type.endswith('_email') else self.push_promotions
        
        return True



import uuid
from django.db import models
from django.utils import timezone
from .models import CustomUser
from .models import House
from .models import Rental
from .models import ComplaintReason  # если ты хранишь причины отдельно
def complaint_evidence_path(instance, filename):
    ext = filename.split('.')[-1]
    return f"evidence/{instance.id}/evidence.{ext}"

class RentalComplaint(models.Model):
    STATUS_CHOICES = [
        ('pending', 'На рассмотрении'),
        ('reviewed', 'Рассмотрено'),
        ('rejected', 'Отклонено'),
    ]

    id = models.AutoField(primary_key=True)

    complainant = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='filed_rental_complaints'
    )

    accused = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='received_rental_complaints')

    reasons = models.ManyToManyField(ComplaintReason)
    description = models.TextField()
    evidence = models.FileField(upload_to=complaint_evidence_path, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    support_count = models.IntegerField(default=0)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    court_decision_score = models.CharField(max_length=30, null=True)

    # Флаг судебная жалоба или нет
    is_court_case = models.BooleanField(default=False)
    
    # Поля для модерации
    admin_comment = models.TextField(blank=True, null=True, help_text="Комментарий администратора")
    moderated_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='moderated_complaints',
        help_text="Администратор, который модерировал жалобу"
    )
    moderated_at = models.DateTimeField(null=True, blank=True, help_text="Дата модерации")

    def save(self, *args, **kwargs):
        if not self.id and self.evidence:
            evidence_file = self.evidence
            self.evidence = None
            super().save(*args, **kwargs)
            self.evidence = evidence_file
            return self.save(update_fields=['evidence'])
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Жалоба от {self.complainant} на {self.accused.identifier}"


import os

def complaint_image_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    count = instance.complaint.images.count() + 1 if instance.complaint_id else 1
    new_filename = f'фото {count}.{ext}'
    return os.path.join(f'complaint_images/{instance.complaint.id if instance.complaint_id else "temp"}', new_filename)

class ComplaintImage(models.Model):
    complaint = models.ForeignKey(RentalComplaint, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(
        upload_to=complaint_image_upload_path,
        validators=[validate_image_file]  # ✅ Валидация изображений (макс 10MB)
    )
    
    def save(self, *args, **kwargs):
        # ✅ Оптимизация: автоматически сжимаем изображение перед сохранением
        if self.image and not self.pk:  # Только при первом сохранении
            try:
                from .utils.image_optimization import optimize_complaint_image
                self.image = optimize_complaint_image(self.image)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Ошибка оптимизации изображения: {e}")
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Изображение для жалобы {self.complaint.id}"

    
class Comment(models.Model):
    complaint = models.ForeignKey(RentalComplaint, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Comment by {self.user.username} on {self.complaint}'


class BlacklistEntry(models.Model):
    REASON_CHOICES = (
        ("violation", "Violation of rules"),
        ("expired_document", "Expired document"),
    )

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="blacklist")
    reason = models.CharField(max_length=32, choices=REASON_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    manual_block = models.BooleanField(default=False)  # true если забанен админом

    def __str__(self):
        return f"{self.user.username} - {self.reason}"
    


class ComplaintSupport(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    complaint = models.ForeignKey(RentalComplaint, on_delete=models.CASCADE, related_name='supports')
    supported_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'complaint')  # гарантирует, что пользователь может поддержать жалобу только один раз

    def __str__(self):
        return f"{self.user} поддержал жалобу {self.complaint.id}"
    
# models.py

class UserViolation(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="violations")
    issued_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name="issued_violations")
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)  # можно снять нарушение, если нужно

    def __str__(self):
        return f"Violation for {self.user.username} (active={self.active})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.user.check_violation_block_status()  # автоматическая проверка на блокировку при сохранении

import os
from django.core.files.storage import default_storage

def dispute_evidence_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    base_path = f'dispute_evidence/{instance.complaint.id}/'
    base_filename = 'evidence'

    # Начинаем с 1 и ищем свободное имя
    counter = 1
    while True:
        final_filename = f'{base_filename}_{counter}.{ext}'
        full_path = os.path.join(base_path, final_filename)
        if not default_storage.exists(full_path):
            break
        counter += 1

    return full_path

class ComplaintDispute(models.Model):
    complaint = models.ForeignKey(RentalComplaint, on_delete=models.CASCADE, related_name="disputes")
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    explanation = models.TextField()
    evidence = models.FileField(upload_to=dispute_evidence_upload_path, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dispute by {self.user.username} on Complaint {self.complaint.id}"



from rest_framework.exceptions import ValidationError  # ✅ правильно для DRF

class UserComment(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="written_comments"
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_comments"
    )
    text = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        # Ограничение: не больше 2 комментариев на 1 юзера от одного автора
        if UserComment.objects.filter(author=self.author, target_user=self.target_user).count() >= 2 and not self.pk:
            raise ValidationError("Вы можете оставить только 2 комментария этому пользователю")

    def save(self, *args, **kwargs):
        self.full_clean()  # проверка перед сохранением
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Comment by {self.author} on {self.target_user}"


class FAQ(models.Model):
    CATEGORY_CHOICES = [
        ('general', 'Общие вопросы'),
        ('rental', 'Аренда'),
        ('complaints', 'Жалобы'),
        ('verification', 'Верификация'),
        ('payments', 'Платежи'),
    ]
    
    USER_TYPE_CHOICES = [
        ('both', 'Для всех'),
        ('tenants', 'Арендаторам'),
        ('landlords', 'Арендодателям'),
    ]
    
    # Основные поля (русский - основной язык)
    question_ru = models.TextField(verbose_name="Вопрос (RU)")
    answer_ru = models.TextField(verbose_name="Ответ (RU)")
    
    # Ручные переводы
    question_kz = models.TextField(blank=True, null=True, verbose_name="Вопрос (KZ)")
    answer_kz = models.TextField(blank=True, null=True, verbose_name="Ответ (KZ)")
    question_en = models.TextField(blank=True, null=True, verbose_name="Вопрос (EN)")
    answer_en = models.TextField(blank=True, null=True, verbose_name="Ответ (EN)")
    
    # Метаданные
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='both')
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    
    # Системные поля
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    
    class Meta:
        ordering = ['user_type', 'category', 'order', 'question_ru']
        verbose_name = "FAQ"
        verbose_name_plural = "FAQ"
    
    def __str__(self):
        return f"{self.question_ru[:50]}..."


class ActivityLog(models.Model):
    """Модель для логирования активности в системе"""
    
    ACTION_TYPES = [
        ('user_register', 'Регистрация пользователя'),
        ('user_login', 'Вход в систему'),
        ('user_logout', 'Выход из системы'),
        ('user_ban', 'Блокировка пользователя'),
        ('user_unban', 'Разблокировка пользователя'),
        ('user_verify', 'Верификация пользователя'),
        ('user_make_admin', 'Назначение администратора'),
        ('user_remove_admin', 'Снятие прав администратора'),
        ('complaint_create', 'Создание жалобы'),
        ('complaint_moderate', 'Модерация жалобы'),
        ('complaint_resolve', 'Разрешение жалобы'),
        ('faq_create', 'Создание FAQ'),
        ('faq_update', 'Обновление FAQ'),
        ('faq_delete', 'Удаление FAQ'),
        ('complaint_reason_create', 'Создание причины жалобы'),
        ('complaint_reason_update', 'Обновление причины жалобы'),
        ('complaint_reason_delete', 'Удаление причины жалобы'),
        ('rental_create', 'Создание аренды'),
        ('rental_confirm', 'Подтверждение аренды'),
        ('rental_reject', 'Отклонение аренды'),
        ('comment_create', 'Создание комментария'),
        ('system_error', 'Системная ошибка'),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Пользователь")
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES, verbose_name="Тип действия")
    action_description = models.TextField(verbose_name="Описание действия")
    target_object_type = models.CharField(max_length=50, null=True, blank=True, verbose_name="Тип объекта")
    target_object_id = models.IntegerField(null=True, blank=True, verbose_name="ID объекта")
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="IP адрес")
    user_agent = models.TextField(null=True, blank=True, verbose_name="User Agent")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="Метаданные")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Лог активности"
        verbose_name_plural = "Логи активности"
        indexes = [
            models.Index(fields=['action_type']),
            models.Index(fields=['user']),
            models.Index(fields=['created_at']),
            models.Index(fields=['target_object_type', 'target_object_id']),
        ]
    
    def __str__(self):
        user_info = f"{self.user.username}" if self.user else "Система"
        return f"{user_info} - {self.get_action_type_display()} ({self.created_at.strftime('%d.%m.%Y %H:%M')})"


# ==================== СИГНАЛЫ ====================

@receiver(post_save, sender=CustomUser)
def create_notification_settings(sender, instance, created, **kwargs):
    """
    Автоматически создает настройки уведомлений для нового пользователя
    """
    if created:
        try:
            NotificationSettings.objects.get_or_create(
                user=instance,
                defaults={
                    'email_enabled': True,
                    'email_complaints': True,
                    'email_rentals': True,
                    'email_system': True,
                    'email_promotions': False,
                    'push_enabled': True,
                    'push_complaints': True,
                    'push_rentals': True,
                    'push_system': True,
                    'push_promotions': False,
                    'sms_enabled': False,
                    'sms_urgent_only': True,
                    'quiet_hours_start': '22:00',
                    'quiet_hours_end': '08:00',
                    'timezone': 'Asia/Almaty',
                    'digest_frequency': 'none'
                }
            )
        except Exception as e:
            print(f"Ошибка создания настроек уведомлений для пользователя {instance.username}: {e}")


@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    """
    Сохраняет профиль пользователя
    """
    if hasattr(instance, 'profile'):
        instance.profile.save()


# ==================== FCM TOKENS ====================

class FCMToken(models.Model):
    """
    Модель для хранения FCM токенов пользователей для push уведомлений
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='fcm_tokens')
    token = models.CharField(max_length=500, unique=True, verbose_name="FCM токен")
    device_type = models.CharField(
        max_length=20,
        choices=[
            ('web', 'Веб-браузер'),
            ('android', 'Android'),
            ('ios', 'iOS'),
            ('desktop', 'Desktop приложение'),
        ],
        default='web',
        verbose_name="Тип устройства"
    )
    device_info = models.JSONField(default=dict, blank=True, verbose_name="Информация об устройстве")
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    last_used = models.DateTimeField(auto_now=True, verbose_name="Последнее использование")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    
    class Meta:
        ordering = ['-last_used']
        verbose_name = "FCM токен"
        verbose_name_plural = "FCM токены"
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['device_type']),
            models.Index(fields=['last_used']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.get_device_type_display()} ({self.token[:20]}...)"


class AuditLog(models.Model):
    """
    Audit Trail для отслеживания доступа к чувствительным данным.
    
    Логирует все важные действия:
    - Просмотр профилей
    - Доступ к документам
    - Изменение данных
    - Экспорт данных
    - Удаление данных
    """
    ACTION_CHOICES = [
        ('view_profile', 'Просмотр профиля'),
        ('view_document', 'Просмотр документа'),
        ('edit_profile', 'Изменение профиля'),
        ('download_document', 'Скачивание документа'),
        ('export_data', 'Экспорт данных (GDPR)'),
        ('delete_data', 'Удаление данных (GDPR)'),
        ('login', 'Вход в систему'),
        ('logout', 'Выход из системы'),
        ('failed_login', 'Неудачная попытка входа'),
        ('register', 'Регистрация'),
        ('password_change', 'Смена пароля'),
        ('view_complaint', 'Просмотр жалобы'),
        ('create_complaint', 'Создание жалобы'),
        ('view_rental', 'Просмотр аренды'),
    ]
    
    # Кто выполнил действие (может быть NULL если неавторизованный)
    user = models.ForeignKey(
        'CustomUser', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='audit_actions'
    )
    
    # Над чьими данными было выполнено действие
    target_user = models.ForeignKey(
        'CustomUser', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='audit_targets'
    )
    
    # Тип действия
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, db_index=True)
    
    # IP адрес пользователя
    ip_address = models.GenericIPAddressField()
    
    # User Agent (браузер/устройство)
    user_agent = models.CharField(max_length=255, blank=True)
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    # Дополнительные данные (JSON)
    details = models.JSONField(default=dict, blank=True)
    
    # Успешность действия
    success = models.BooleanField(default=True)
    
    # Сообщение об ошибке (если не успешно)
    error_message = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['target_user', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
            models.Index(fields=['ip_address', '-timestamp']),
            models.Index(fields=['-timestamp']),  # Для общей выборки по дате
        ]
    
    def __str__(self):
        if self.user:
            return f"{self.timestamp} | {self.user.username} | {self.get_action_display()}"
        else:
            return f"{self.timestamp} | Anonymous | {self.get_action_display()}"
    
    @classmethod
    def log_action(cls, action, request=None, user=None, target_user=None, details=None, success=True, error_message=None):
        """
        Утилита для создания audit log записи.
        
        Использование:
        ```python
        AuditLog.log_action(
            action='view_profile',
            request=request,
            target_user=profile_user,
            details={'profile_id': profile_user.id}
        )
        ```
        """
        # Получаем IP адрес
        if request:
            ip_address = request.META.get('HTTP_X_FORWARDED_FOR')
            if ip_address:
                ip_address = ip_address.split(',')[0]
            else:
                ip_address = request.META.get('REMOTE_ADDR', '0.0.0.0')
            
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:255]
            
            # Если user не указан, берем из request
            if not user and hasattr(request, 'user') and request.user.is_authenticated:
                user = request.user
        else:
            ip_address = '0.0.0.0'
            user_agent = ''
        
        # Создаем запись
        return cls.objects.create(
            user=user,
            target_user=target_user,
            action=action,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details or {},
            success=success,
            error_message=error_message
        )
