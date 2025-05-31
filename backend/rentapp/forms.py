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
        fields = ('username', 'email', 'role', 'phone_number', 'type_entity', 'type_identify', 'identifier', 'password1', 'password2')
    
    role = forms.ChoiceField(choices=CustomUser.ROLE_CHOICES, label="Role", widget=forms.Select(attrs={'class': 'form-control'}))
    phone_number = forms.CharField(max_length=15, required=False, label="Phone Number", widget=forms.TextInput(attrs={'class': 'form-control'}))
    email = forms.EmailField(required=True, widget=forms.EmailInput(attrs={'class': 'form-control'}))
    identifier = forms.CharField(max_length=15, required=False, label="Identifier", widget=forms.TextInput(attrs={'class': 'form-control'}))
    type_entity = forms.ChoiceField(choices=CustomUser.type_chose, label="Entity Type", widget=forms.Select(attrs={'class': 'form-control'}))
    type_identify = forms.ChoiceField(choices=CustomUser.type_chose1, label="Identity Type", widget=forms.Select(attrs={'class': 'form-control'}))

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
    class Meta:
        model = House
        fields = ['address', 'type_p', 'num_of_rooms', 'comment']  # Убираем поле 'owner'
        widgets = {
            'type_p': forms.Select(choices=House.PROPERTY_TYPE_CHOICES),
            'num_of_rooms': forms.NumberInput(attrs={'min': 1}),
            'address': forms.TextInput(attrs={'placeholder': 'Введите адрес'}),
            'comment': forms.TextInput(attrs={'placeholder': 'Описание'})
        }


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
        choices=[(adress, adress) for adress in House.objects.values_list('address', flat=True).distinct()],
        widget=forms.Select,  # Для выпадающего списка
        label="Адрес"
    )
    reason = forms.ModelMultipleChoiceField(
        queryset=ComplaintReason.objects.all(),  # Получаем причины из базы данных
        widget=forms.CheckboxSelectMultiple,  # Виджет для множественного выбора
        label="Причины жалобы"
    )
    description = forms.CharField(widget=forms.Textarea, label="Описание жалобы")
    rating = forms.ChoiceField(
        label="Рейтинг", 
        choices=[(i, f'{i} звезда') for i in range(1, 6)], 
        widget=forms.RadioSelect
    )
    evidence = forms.FileField(
        label="Прикрепить документы",
        widget=forms.FileInput(attrs={'multiple': False}),
        required=False
    )


    class Meta:
        model = Complaint
        fields = [ 'description', 'rating']

    
    def clean(self):
        cleaned_data = super().clean()
        tenant_iin = cleaned_data.get("tenant_identity_iin")
        landlord_iin = cleaned_data.get("landlord_identity_iin")

        if not CustomUser.objects.filter(identifier=tenant_iin).exists():
            self.add_error('tenant_identity_iin', "Арендатор с таким ИИН не найден.")
        if not CustomUser.objects.filter(identifier=landlord_iin).exists():
            self.add_error('landlord_identity_iin', "Арендодатель с таким ИИН не найден.")

        return cleaned_data
    
