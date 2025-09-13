from rest_framework import serializers
from .models import ActivityLog, CustomUser, IdentityVerification, House, ComplaintReason, Complaint, Notification, NotificationSettings, PasswordChangeRequest, Reputation, Comment, FAQ, FCMToken

from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError
from rest_framework import serializers
from .models import CustomUser, RentalComplaint


from rest_framework import serializers
from .models import ComplaintDispute
from .models import CustomUser  # если CustomUser не в том же приложении

class UserShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username']

class ComplaintDisputeSerializer(serializers.ModelSerializer):
    user = UserShortSerializer(read_only=True)

    class Meta:
        model = ComplaintDispute
        fields = ['id', 'user', 'explanation', 'evidence', 'created_at']

# serializers.py

from rest_framework import serializers
from .models import Complaint, House, CustomUser

class HouseSerializer(serializers.ModelSerializer):
    is_rented = serializers.SerializerMethodField()
    address = serializers.CharField(max_length=255, min_length=5, required=True)
    type_p = serializers.CharField(max_length=50, required=True)
    images = serializers.SerializerMethodField()

    class Meta:
        model = House
        fields = '__all__'
        read_only_fields = ['owner']

    def get_is_rented(self, obj):
        from .models import Rental
        from django.utils import timezone
        now = timezone.now().date()
        return Rental.objects.filter(house=obj, start_date__lte=now, end_date__gte=now, status='active').exists()

    def get_images(self, obj):
        """Возвращает список URL изображений для дома"""
        return [image.image.url for image in obj.images.all()]

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)

class HouseCreateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания новой квартиры/дома.
    Использует только определенные поля для создания.
    """
    address = serializers.CharField(max_length=255, min_length=5, required=True)
    type_p = serializers.CharField(max_length=20, required=True)
    num_of_rooms = serializers.IntegerField(min_value=1, required=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.00, required=True)
    description = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    area = serializers.FloatField(min_value=0, required=False)
    floor = serializers.IntegerField(min_value=0, required=False)
    total_floors = serializers.IntegerField(min_value=1, required=False)
    year_built = serializers.IntegerField(min_value=1900, required=False)
    is_furnished = serializers.BooleanField(required=False, default=False)
    has_balcony = serializers.BooleanField(required=False, default=False)
    comment = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    images = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = House
        fields = [
            'address', 'type_p', 'num_of_rooms', 'price', 'description',
            'area', 'floor', 'total_floors', 'year_built', 'is_furnished',
            'has_balcony', 'comment', 'images'
        ]
        read_only_fields = ['owner']

    def create(self, validated_data):
        # Извлекаем изображения из validated_data
        images = validated_data.pop('images', [])
        
        # Создаем дом
        validated_data['owner'] = self.context['request'].user
        house = super().create(validated_data)
        
        # Создаем изображения для дома
        for image in images:
            from .models import HouseImage
            HouseImage.objects.create(house=house, image=image)
        
        return house

class UserShortSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['identifier', 'username', 'display_name', 'anonymous_name']

    def get_display_name(self, obj):
        return obj.anonymous_name or obj.username or f"Пользователь {obj.identifier}"

class ComplaintRegistrySerializer(serializers.ModelSerializer):
    accused = UserShortSerializer(read_only=True)
    property = serializers.SerializerMethodField()

    class Meta:
        model = RentalComplaint
        fields = [
            'id', 'uuid', 'created_at', 'accused', 'property'
        ]

    def get_property(self, obj):
        return {
            'address': obj.rental.house.address if obj.rental and obj.rental.house else None
        }

# serializers.py
from rest_framework import serializers
from .models import CustomUser

class UserProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id',
            'username',
            'anonymous_name',
            'role',
            'thirdname',
            'phone_number',
            'email',
            'email_confirmed',
            'phone_confirmed',
            'type_entity',
            'type_identify',
            'identifier',
            'avatar',
            'r_date'
        ]
    
    def get_avatar(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return '/media/avatars/def.jpg'


class CustomUserSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    complaint_count = serializers.IntegerField(read_only=True)
    court_scores = serializers.SerializerMethodField()
    complaint_dates = serializers.SerializerMethodField()
    complaint_reasons = serializers.SerializerMethodField()
    complaint_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = CustomUser
        fields = '__all__'  # или перечисли поля явно
    def get_complaint_dates(self, obj):
        complaints = obj.received_rental_complaints.filter(status='reviewed')
        return [c.created_at.isoformat() for c in complaints]
    def validate(self, attrs):
        password1 = attrs.get('password1')
        password2 = attrs.get('password2')

        if password1 != password2:
            raise serializers.ValidationError("Пароли не совпадают.")
        
        # Валидация ИИН
        identifier = attrs.get('identifier')
        if identifier:
            if not identifier.isdigit() or len(identifier) != 12:
                raise serializers.ValidationError("ИИН должен содержать ровно 12 цифр.")
        
        return attrs

    def create(self, validated_data):
        password1 = validated_data.pop('password1')
        validated_data.pop('password2')

        user = CustomUser.objects.create_user(**validated_data)
        user.set_password(password1)
        user.save()
        return user
    def get_court_scores(self, obj):
        # Получаем уникальные court_decision_score по жалобам пользователя с фильтром по accused и статусу, например
        scores_qs = obj.received_rental_complaints.filter(
            accused=obj,
            status='reviewed'
        ).values_list('court_decision_score', flat=True).distinct()

        # Преобразуем в строки и фильтруем None или пустые
        scores = [str(score) for score in scores_qs if score]
        return ", ".join(scores)

    def get_complaint_reasons(self, obj):
        # Получаем уникальные причины через связь ManyToMany или ForeignKey
        # Предположим, reasons - ManyToMany в жалобах, нужно получить уникальные reason__reason
        reasons_qs = obj.received_rental_complaints.filter(
            accused=obj,
            status='reviewed'
        ).values_list('reasons__reason', flat=True).distinct()

        reasons = [reason for reason in reasons_qs if reason]
        return ", ".join(reasons)
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Приводим к bool вручную (если нужно)
        data['email_confirmed'] = bool(instance.email_confirmed)
        return data


# serializers.py

from rest_framework import serializers
from .models import Complaint, CustomUser, ComplaintImage

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    is_current_user = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        # Только публичные поля по умолчанию
        fields = [
            'id', 'username', 'anonymous_name', 'display_name', 'role', 'avatar', 'is_current_user'
        ]

    def get_avatar(self, obj):
        return obj.get_avatar_url()

    def get_is_current_user(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.id == request.user.id
        return False

    def get_display_name(self, obj):
        return obj.anonymous_name or obj.username

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Если это текущий пользователь — добавить приватные поля
        if data.get('is_current_user'):
            data['email'] = instance.email
            data['phone_number'] = instance.phone_number
            data['is_superuser'] = instance.is_superuser
        return data

class CommentSerializer(serializers.ModelSerializer):
    user_data = serializers.SerializerMethodField()  # Отдельное поле с данными пользователя

    class Meta:
        model = Comment
        fields = ['id', 'complaint', 'user', 'text', 'created_at', 'user_data']  # user — ID, user_data — объект

    def get_user_data(self, obj):
        return UserSerializer(obj.user).data


class ComplaintReasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintReason
        fields = ['id', 'reason', 'type', 'is_default', 'order']


class ComplaintImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintImage
        fields = ['id', 'image']

class RentalComplaintSerializer(serializers.ModelSerializer):
    complainant = UserSerializer(read_only=True)
    accused = UserSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    reasons = ComplaintReasonSerializer(many=True, read_only=True)
    evidence = serializers.FileField(read_only=True)
    user = UserSerializer(read_only=True)
    disputes = ComplaintDisputeSerializer(many=True, read_only=True)
    images = serializers.SerializerMethodField()

    class Meta:
        model = RentalComplaint
        fields = [
            'id', 'uuid', 'description', 'support_count', 'status',
            'complainant', 'accused', 'reasons', 'evidence',
            'comments', 'created_at', 'user', 'court_decision_score', 'images', 'disputes'
        ]
        read_only_fields = [
            'complainant', 'accused', 'created_at', 'user', 'support_count', 'images'
        ]

    def get_images(self, obj):
        return [image.image.url for image in obj.images.all()]

    

    

class RentalApartments(serializers.ModelSerializer):
    class Meta: 
        model = RentalComplaint
        fields ='__all__'




class IdentityVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = IdentityVerification
        fields = ['id', 'user', 'id_document', 'verified']

from rest_framework import serializers
from .models import Rental

class MyRentalSerializer(serializers.ModelSerializer):
    house_address = serializers.CharField(source='house.address', read_only=True)
    landlord_iin = serializers.CharField(source='house.owner.identity_iin', read_only=True)

    class Meta:
        model = Rental
        fields = ['id', 'house_address', 'landlord_iin']


from rest_framework import serializers
from .models import RentalComplaint


class ComplaintCreateSerializer(serializers.Serializer):
    tenant_identity_iin = serializers.CharField(max_length=12, min_length=12, required=True)
    landlord_identity_iin = serializers.CharField(max_length=12, min_length=12, required=True)
    address = serializers.CharField(max_length=255, min_length=5, required=True)
    description = serializers.CharField(max_length=1000, min_length=10, required=True)
    #rating = serializers.IntegerField(min_value=1, max_value=5, required=True)
    reason = serializers.ListField(child=serializers.IntegerField(), min_length=1, required=True)
    evidence = serializers.FileField(required=False)

class ReputationSerializer(serializers.ModelSerializer):
    comment = serializers.CharField(max_length=500, required=False)
    class Meta:
        model = Reputation
        fields = ['id', 'tenant_identifier', 'author_identifier', 'comment', 'status', 'created_at']
        read_only_fields = ['created_at']

from rest_framework import serializers
from .models import Rental, Favorite, ChatThread, ChatMessage, Notification



class RentalSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.username", read_only=True)
    house_address = serializers.CharField(source="house.address", read_only=True)
    house = HouseSerializer(read_only=True)

    class Meta:
        model = Rental
        fields = [
            'id', 'house', 'house_address', 'tenant', 'tenant_name',
            'status', 'start_date', 'end_date'
        ]
        read_only_fields = ['tenant', 'updated_at']

from rest_framework import serializers
from .models import Rental

# serializers.py
class RentalRequestSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.username', read_only=True)
    house_address = serializers.CharField(source='house.address', read_only=True)

    class Meta:
        model = Rental
        fields = [
            'id', 'tenant_name', 'house_address', 'status', 'start_date', 'end_date'
        ]
        read_only_fields = ['tenant_name', 'house_address']



class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ['id', 'user', 'house', 'created_at']
        read_only_fields = ['user', 'created_at']

class ChatThreadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatThread
        fields = ['id', 'user1', 'user2', 'created_at']
        read_only_fields = ['created_at']

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'thread', 'sender', 'message', 'created_at']
        read_only_fields = ['created_at']




from rest_framework import serializers

class ImageUploadSerializer(serializers.Serializer):
    id_document = serializers.FileField(required=True)
    texts_to_find = serializers.ListField(
        child=serializers.CharField(max_length=255), required=True, min_length=1
    )


from rest_framework import serializers
from .models import CustomUser as User
from .models import PasswordChangeRequest

class RequestPasswordChangeSerializer(serializers.Serializer):
    email_or_username = serializers.CharField(required=True, max_length=255)

    def validate_email_or_username(self, value):
        if not value:
            raise serializers.ValidationError("Поле обязательно для заполнения.")
        return value

class ConfirmPasswordChangeSerializer(serializers.Serializer):
    email_or_username = serializers.CharField(required=True, max_length=255)
    code = serializers.CharField(max_length=6, min_length=6, required=True)
    new_password = serializers.CharField(min_length=8, max_length=128, required=True)

    def validate(self, data):
        if not data.get('email_or_username') or not data.get('code') or not data.get('new_password'):
            raise serializers.ValidationError("Все поля обязательны для заполнения.")
        return data



# rentapp/serializers.py

from rest_framework import serializers
from .models import CustomUser


class UserSearchSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ["identifier", "full_name", "role"]

    def get_full_name(self, obj):
        # Собираем ФИО из стандартных полей
        parts = [obj.first_name, obj.last_name, obj.thirdname]
        return " ".join([p for p in parts if p])


# serializers.py
from rest_framework import serializers
from .models import UserComment

class UserCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.anonymous_name", read_only=True)

    class Meta:
        model = UserComment
        fields = ["id", "author", "author_name", "target_user", "text", "created_at"]
        read_only_fields = ["author", "created_at"]


# ==================== FAQ SERIALIZERS ====================

class FAQSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = FAQ
        fields = [
            'id', 'question_ru', 'answer_ru', 
            'question_kz', 'answer_kz', 
            'question_en', 'answer_en',
            'category', 'user_type', 'is_active', 'order',
            'created_at', 'updated_at', 'created_by', 'created_by_username'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

class PublicFAQSerializer(serializers.ModelSerializer):
    question = serializers.SerializerMethodField()
    answer = serializers.SerializerMethodField()
    
    def get_question(self, obj):
        locale = self.context.get('locale', 'ru')
        if locale == 'kz' and obj.question_kz:
            return obj.question_kz
        elif locale == 'en' and obj.question_en:
            return obj.question_en
        return obj.question_ru
    
    def get_answer(self, obj):
        locale = self.context.get('locale', 'ru')
        if locale == 'kz' and obj.answer_kz:
            return obj.answer_kz
        elif locale == 'en' and obj.answer_en:
            return obj.answer_en
        return obj.answer_ru
    
    class Meta:
        model = FAQ
        fields = ['id', 'question', 'answer', 'category', 'user_type', 'order']


# ==================== COMPLAINT REASON SERIALIZERS ====================

class ComplaintReasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintReason
        fields = [
            'id', 'reason', 'reason_kz', 'reason_en', 
            'type', 'is_default', 'order'
        ]

class PublicComplaintReasonSerializer(serializers.ModelSerializer):
    reason_text = serializers.SerializerMethodField()
    
    def get_reason_text(self, obj):
        locale = self.context.get('locale', 'ru')
        if locale == 'kz' and obj.reason_kz:
            return obj.reason_kz
        elif locale == 'en' and obj.reason_en:
            return obj.reason_en
        return obj.reason
    
    class Meta:
        model = ComplaintReason
        fields = ['id', 'reason_text', 'type', 'order']


class ActivityLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'user_username', 'user_email', 'action_type', 
            'action_type_display', 'action_description', 'target_object_type',
            'target_object_id', 'ip_address', 'metadata', 'created_at'
        ]


class NotificationSerializer(serializers.ModelSerializer):
    """Сериализатор для уведомлений"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'type_display', 'priority', 'priority_display',
            'title', 'message', 'is_read', 'action_url', 'metadata',
            'created_at', 'read_at', 'time_ago'
        ]
    
    def get_time_ago(self, obj):
        """Возвращает время в формате "X минут назад" """
        from django.utils import timezone
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"{diff.days} дней назад"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} часов назад"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} минут назад"
        else:
            return "Только что"


class NotificationSettingsSerializer(serializers.ModelSerializer):
    """Сериализатор для настроек уведомлений"""
    
    class Meta:
        model = NotificationSettings
        fields = [
            'email_enabled', 'email_complaints', 'email_rentals', 
            'email_system', 'email_promotions',
            'push_enabled', 'push_complaints', 'push_rentals', 
            'push_system', 'push_promotions',
            'sms_enabled', 'sms_urgent_only', 'phone_number',
            'quiet_hours_start', 'quiet_hours_end', 'timezone',
            'digest_frequency'
        ]


class FCMTokenSerializer(serializers.ModelSerializer):
    """Сериализатор для FCM токенов"""
    
    class Meta:
        model = FCMToken
        fields = [
            'id', 'token', 'device_type', 'device_info', 
            'is_active', 'last_used', 'created_at'
        ]
        read_only_fields = ['id', 'last_used', 'created_at']
    
    def create(self, validated_data):
        # Если токен уже существует, обновляем его
        token = validated_data.get('token')
        user = self.context['request'].user
        
        fcm_token, created = FCMToken.objects.get_or_create(
            token=token,
            defaults={
                'user': user,
                'device_type': validated_data.get('device_type', 'web'),
                'device_info': validated_data.get('device_info', {}),
                'is_active': True
            }
        )
        
        if not created:
            # Обновляем существующий токен
            fcm_token.user = user
            fcm_token.device_type = validated_data.get('device_type', 'web')
            fcm_token.device_info = validated_data.get('device_info', {})
            fcm_token.is_active = True
            fcm_token.save()
        
        return fcm_token