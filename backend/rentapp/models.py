from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from allauth.account.signals import user_signed_up
from django.core.validators import RegexValidator
from django.dispatch import receiver
import random
from PIL import Image
class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('landlord', 'Landlord'),
        ('tenant', 'Tenant'),
    )
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
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    thirdname = models.CharField(max_length=20, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)  
    email_confirmed = models.BooleanField(default=False)
    phone_confirmed = models.BooleanField(default=False)
    type_entity = models.CharField(max_length=30, choices=type_chose, default='individual')
    type_identify = models.CharField(max_length=12, choices=type_chose1)
    documents = models.JSONField(default=dict, blank=True, null=True)
    identifier = models.CharField(max_length=15, blank=True, null=True)  
    confirmation_code = models.CharField(max_length=6, blank=True, null=True)
    rating = models.PositiveSmallIntegerField(default=5)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, default='avatars/def.jpg')
    r_date = models.DateTimeField(null=True)

    def generate_confirmation_code(self):
        self.confirmation_code = str(random.randint(100000, 999999))
        self.save()
    def save(self, *args, **kwargs):
        if self.type_entity != 'legal_entity':
            self.documents = {}
            self.type_identify = 'iin'
        elif self.type_entity == 'legal_entity':
            self.type_identify = 'bin'
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

class IdentityVerification(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    id_document = models.FileField(upload_to='id_documents/')
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
    owner = models.ForeignKey('CustomUser', on_delete=models.CASCADE)
    
    # Основное поле адреса (оставляем для обратной совместимости)
    address = models.CharField(max_length=255)
    
    # Иерархические поля адреса
    street = models.CharField(max_length=255, verbose_name="Улица", null=True, blank=True)
    microdistrict = models.CharField(max_length=255, verbose_name="Микрорайон", null=True, blank=True)
    district = models.CharField(max_length=255, verbose_name="Район", null=True, blank=True)
    city = models.CharField(max_length=255, verbose_name="Город", null=True, blank=True)
    region = models.CharField(max_length=255, verbose_name="Область", null=True, blank=True)
    
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



class ComplaintReason(models.Model):
    TENANT = 'tenant'
    LANDLORD = 'landlord'

    REASON_TYPE_CHOICES = [
        (TENANT, 'Tenant'),
        (LANDLORD, 'Landlord'),
    ]

    reason = models.CharField(max_length=255, unique=True)
    type = models.CharField(max_length=20, choices=REASON_TYPE_CHOICES, default='')

    def __str__(self):
        return f"{self.reason} ({self.type})"
    
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
    rating = models.PositiveSmallIntegerField(default=3)
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
        ('complaint_received', 'Получена жалоба'),
        ('complaint_status_updated', 'Обновлен статус жалобы'),
        ('complaint_supported', 'Жалоба поддержана'),
        ('complaint_commented', 'Новый комментарий к жалобе'),
        ('rental_confirmed', 'Аренда подтверждена'),
        ('rental_rejected', 'Аренда отклонена'),
    )

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default='complaint_received')
    title = models.CharField(max_length=255, default='Уведомление')
    message = models.TextField()
    related_complaint = models.ForeignKey('RentalComplaint', on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.type} - {self.user.username}'



import uuid
from django.db import models
from django.utils import timezone
from .models import CustomUser
from .models import House
from .models import Rental
from .models import ComplaintReason  # если ты хранишь причины отдельно

class RentalComplaint(models.Model):
    STATUS_CHOICES = [
        ('pending', 'На рассмотрении'),
        ('reviewed', 'Рассмотрено'),
        ('rejected', 'Отклонено'),
    ]

    id = models.AutoField(primary_key=True)
    rental = models.ForeignKey(Rental, on_delete=models.CASCADE, related_name='complaints')
    complainant = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='filed_rental_complaints')
    accused = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='received_rental_complaints')
    reasons = models.ManyToManyField(ComplaintReason)
    description = models.TextField()
    evidence = models.FileField(upload_to='evidence/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    support_count = models.IntegerField(default=0)
    rating = models.PositiveSmallIntegerField(default=3)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    court_decision_score = models.IntegerField(default=0)


    def __str__(self):
        return f"Жалоба от {self.complainant} на {self.accused} по аренде {self.rental.id}"


class ComplaintImage(models.Model):
    complaint = models.ForeignKey(RentalComplaint, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='complaint_images/')
    
    def __str__(self):
        return f"Изображение для жалобы {self.complaint.id}"
    
class Comment(models.Model):
    complaint = models.ForeignKey(RentalComplaint, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Comment by {self.user.username} on {self.complaint}'
