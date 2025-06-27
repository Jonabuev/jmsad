from rest_framework import serializers
from .models import CustomUser, IdentityVerification, House, ComplaintReason, Complaint, PasswordChangeRequest, Reputation, Comment

from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError
from rest_framework import serializers
from .models import CustomUser, RentalComplaint



# serializers.py

from rest_framework import serializers
from .models import Complaint, House, CustomUser

class HouseSerializer(serializers.ModelSerializer):
    is_rented = serializers.SerializerMethodField()
    address = serializers.CharField(max_length=255, min_length=5, required=True)
    type_p = serializers.CharField(max_length=50, required=True)

    class Meta:
        model = House
        fields = '__all__'
        read_only_fields = ['owner']

    def get_is_rented(self, obj):
        from .models import Rental
        from django.utils import timezone
        now = timezone.now().date()
        return Rental.objects.filter(house=obj, start_date__lte=now, end_date__gte=now, status='active').exists()

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)

class UserShortSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['identifier', 'username', 'display_name']

    def get_display_name(self, obj):
        return obj.username or f"Пользователь {obj.identifier}"

class ComplaintRegistrySerializer(serializers.ModelSerializer):
    accused = UserShortSerializer(read_only=True)
    property = serializers.SerializerMethodField()

    class Meta:
        model = RentalComplaint
        fields = [
            'id', 'uuid', 'created_at', 'rating', 'accused', 'property'
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
            'role',
            'thirdname',
            'phone_number',
            'email',
            'email_confirmed',
            'phone_confirmed',
            'type_entity',
            'type_identify',
            'identifier',
            'rating',
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


# serializers.py

from rest_framework import serializers
from .models import Complaint, CustomUser, ComplaintImage

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    is_current_user = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        # Только публичные поля по умолчанию
        fields = [
            'id', 'username', 'role', 'avatar', 'rating', 'is_current_user'
        ]

    def get_avatar(self, obj):
        return obj.get_avatar_url()

    def get_is_current_user(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.id == request.user.id
        return False

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
        fields = ['id', 'reason']


class ComplaintImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintImage
        fields = ['id', 'image']

class RentalComplaintSerializer(serializers.ModelSerializer):
    complainant = UserSerializer(read_only=True)
    accused = UserSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    reasons = ComplaintReasonSerializer(many=True, read_only=True)
    property = serializers.SerializerMethodField()
    evidence = serializers.FileField(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = RentalComplaint
        fields = [
            'id', 'uuid', 'description', 'support_count', 'status', 'rating',
            'complainant', 'accused', 'property', 'reasons', 'evidence',
            'comments', 'created_at', 'user', 'court_decision_score', 'images'
        ]
        read_only_fields = [
            'complainant', 'accused', 'created_at', 'user', 'support_count', 'images'
        ]

    def get_property(self, obj):
        return HouseSerializer(obj.rental.house).data if obj.rental and obj.rental.house else None

    

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
    rating = serializers.IntegerField(min_value=1, max_value=5, required=True)
    reason = serializers.ListField(child=serializers.IntegerField(), min_length=1, required=True)
    evidence = serializers.FileField(required=False)

class ReputationSerializer(serializers.ModelSerializer):
    comment = serializers.CharField(max_length=500, required=False)
    class Meta:
        model = Reputation
        fields = ['id', 'tenant_identifier', 'author_identifier', 'rating', 'comment', 'status', 'created_at']
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

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'is_read', 'created_at', 'related_complaint']
        read_only_fields = ['id', 'created_at']


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



