from django.utils import timezone
from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser

from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser

from django import forms
from django.core.exceptions import ValidationError
from .models import CustomUser

class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = CustomUser
        fields = (
            'username', 'email', 'role', 'phone_number',
            'type_entity', 'type_identify', 'identifier',
            'document_type', 'passport_expiry', "citizenship",
            'password1', 'password2'
        )

    role = forms.ChoiceField(choices=CustomUser.ROLE_CHOICES, label="Role", widget=forms.Select(attrs={'class': 'form-control'}))
    phone_number = forms.CharField(max_length=15, required=False, label="Phone Number", widget=forms.TextInput(attrs={'class': 'form-control'}))
    email = forms.EmailField(required=True, widget=forms.EmailInput(attrs={'class': 'form-control'}))
    identifier = forms.CharField(max_length=15, required=False, label="Identifier", widget=forms.TextInput(attrs={'class': 'form-control'}))
    type_entity = forms.ChoiceField(choices=CustomUser.type_chose, label="Entity Type", widget=forms.Select(attrs={'class': 'form-control'}))
    type_identify = forms.ChoiceField(choices=CustomUser.type_chose1, label="Identity Type", widget=forms.Select(attrs={'class': 'form-control'}))
    
    passport_expiry = forms.DateField(
        required=True,
        label="Срок действия документа",
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'})
    )

    document_type = forms.ChoiceField(
        choices=CustomUser.DOCUMENT_TYPES,
        label="Document Type",
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if CustomUser.objects.filter(email=email).exists():
            raise ValidationError("Пользователь с таким email уже существует.")
        return email

    def clean_identifier(self):
        identifier = self.cleaned_data.get('identifier')
        if identifier and CustomUser.objects.filter(identifier=identifier).exists():
            raise ValidationError("Пользователь с таким ИИН/БИН уже существует.")
        return identifier

    def clean(self):
        cleaned_data = super().clean()
        type_entity = cleaned_data.get("type_entity")
        identifier = cleaned_data.get("identifier")

        if type_entity == 'legal_entity' and not identifier:
            self.add_error('identifier', "Юридическое лицо должно иметь ИИН/БИН.")

        expiry_date = cleaned_data.get("passport_expiry")

        if expiry_date and expiry_date < timezone.now().date():
            self.add_error("passport_expiry", "Срок действия документа истёк.")    
        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        if user.type_entity == 'legal_entity':
            user.type_identify = 'БИН'
        elif user.type_entity == 'individual':
            user.type_identify = 'ИИН'

        if commit:
            user.save()
        return user




from django import forms
from .models import House

class HouseForm(forms.ModelForm):
    images = forms.ImageField(label="Фотографии", widget=forms.FileInput(), required=False)
    class Meta:
        model = House
        fields = ['street', 'microdistrict', 'district', 'city', 'region', 'type_p', 'num_of_rooms', 'comment',
                  'description', 'area', 'floor', 'total_floors', 'year_built', 'is_furnished', 'has_balcony']
        widgets = {
            'street': forms.TextInput(attrs={'placeholder': 'Введите улицу и номер дома', 'class': 'form-control'}),
            'microdistrict': forms.TextInput(attrs={'placeholder': 'Введите микрорайон', 'class': 'form-control'}),
            'district': forms.TextInput(attrs={'placeholder': 'Введите район', 'class': 'form-control'}),
            'city': forms.TextInput(attrs={'placeholder': 'Введите город', 'class': 'form-control'}),
            'region': forms.TextInput(attrs={'placeholder': 'Введите область', 'class': 'form-control'}),
            'type_p': forms.Select(choices=House.PROPERTY_TYPE_CHOICES, attrs={'class': 'form-control'}),
            'num_of_rooms': forms.NumberInput(attrs={'min': 1, 'class': 'form-control'}),
            'comment': forms.Textarea(attrs={'placeholder': 'Комментарий', 'class': 'form-control'}),
            'description': forms.Textarea(attrs={'placeholder': 'Описание', 'class': 'form-control'}),
            'area': forms.NumberInput(attrs={'placeholder': 'Площадь (м²)', 'class': 'form-control', 'min': 0}),
            'floor': forms.NumberInput(attrs={'placeholder': 'Этаж', 'class': 'form-control', 'min': 0}),
            'total_floors': forms.NumberInput(attrs={'placeholder': 'Этажность дома', 'class': 'form-control', 'min': 0}),
            'year_built': forms.NumberInput(attrs={'placeholder': 'Год постройки', 'class': 'form-control', 'min': 1800, 'max': 2100}),
            'is_furnished': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'has_balcony': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }

    def save(self, commit=True):
        instance = super().save(commit=False)
        # Формируем полный адрес из компонентов
        instance.address = f"{instance.street}, {instance.microdistrict}, {instance.district}, {instance.city}, {instance.region}"
        if commit:
            instance.save()
        return instance


from django import forms
from .models import CustomUser, Complaint

class TenantProfileForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        fields = ['username', 'phone_number', 'email', 'avatar']  # Фото профиля


from django import forms
from .models import Complaint, IdentityVerification, House, ComplaintReason

class ComplaintReasonForm(forms.ModelForm):
    class Meta:
        model = ComplaintReason
        fields = ['reason']


class ComplaintForm(forms.ModelForm):
    tenant_identity_iin = forms.CharField(label="ИИН арендатора", max_length=12)
    landlord_identity_iin = forms.CharField(label="ИИН арендодателя", max_length=12)
    
    adress = forms.ChoiceField(
        choices=[],  # Пустой список, будет заполнен динамически
        widget=forms.Select,  # Для выпадающего списка
        label="Адрес"
    )
    reason = forms.ModelMultipleChoiceField(
        queryset=ComplaintReason.objects.none(),  # Пустой queryset, будет заполнен динамически
        widget=forms.CheckboxSelectMultiple,  # Виджет для множественного выбора
        label="Причины жалобы"
    )
    description = forms.CharField(widget=forms.Textarea, label="Описание жалобы")
    """rating = forms.ChoiceField(
        label="Рейтинг", 
        choices=[(i, f'{i} звезда') for i in range(1, 6)], 
        widget=forms.RadioSelect
    )"""
    evidence = forms.FileField(
        label="Прикрепить документы",
        widget=forms.FileInput(attrs={'multiple': False}),
        required=False
    )


    class Meta:
        model = Complaint
        fields = [ 'description']

    
    def clean(self):
        cleaned_data = super().clean()
        tenant_iin = cleaned_data.get("tenant_identity_iin")
        landlord_iin = cleaned_data.get("landlord_identity_iin")

        if not CustomUser.objects.filter(identifier=tenant_iin).exists():
            self.add_error('tenant_identity_iin', "Арендатор с таким ИИН не найден.")
        if not CustomUser.objects.filter(identifier=landlord_iin).exists():
            self.add_error('landlord_identity_iin', "Арендодатель с таким ИИН не найден.")

        return cleaned_data
    
