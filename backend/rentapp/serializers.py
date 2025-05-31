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
    class Meta:
        model = House
        fields = ['id', 'address', 'type_p', 'latitude', 'longitude']

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
            'id',
            'uuid',
            'created_at',
            'rating',
            'accused',
            'property',
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

    class Meta:
        model = CustomUser
        fields = '__all__'  # или перечисли поля явно

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


# serializers.py

from rest_framework import serializers
from .models import Complaint, CustomUser

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'email_confirmed', 'identifier', 
            'role', 'phone_number', 'avatar', 'is_superuser', 'rating'
        ]

    def get_avatar(self, obj):
        return obj.get_avatar_url()

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

class RentalComplaintSerializer(serializers.ModelSerializer):
    complainant = UserSerializer(read_only=True)
    accused = UserSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)  # если есть связь с комментариями
    reasons = ComplaintReasonSerializer(many=True, read_only=True)
    property = serializers.SerializerMethodField()
    evidence = serializers.FileField(read_only=True)
    user=CustomUserSerializer(read_only=True)
    class Meta:
        model = RentalComplaint
        fields = [
            'id',
            'uuid',
            'description',
            'support_count',
            'status',
            'rating',
            'complainant',
            'accused',
            'property',
            'reasons',
            'evidence',
            'comments',
            'created_at',
            'user'
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

class HouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = House
        fields = '__all__'
        read_only_fields = ['owner']  # чтобы пользователь не мог сам задать owner

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user  # ← устанавливаем owner
        return super().create(validated_data)

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
    tenant_identity_iin = serializers.CharField()
    landlord_identity_iin = serializers.CharField()
    address = serializers.CharField()
    description = serializers.CharField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    reason = serializers.ListField(child=serializers.IntegerField())
    evidence = serializers.FileField(required=False)

class ReputationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reputation
        fields = ['id', 'tenant_identifier', 'author_identifier', 'rating', 'comment', 'status', 'created_at']

from rest_framework import serializers
from .models import Rental, Favorite, ChatThread, ChatMessage, Notification



class RentalSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.username", read_only=True)
    house_address = serializers.CharField(source="house.address", read_only=True)
    house = HouseSerializer(read_only=True)
    class Meta:
        model = Rental
        fields = '__all__'

from rest_framework import serializers
from .models import Rental

# serializers.py
class RentalRequestSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.username', read_only=True)
    house_address = serializers.CharField(source='house.address', read_only=True)

    class Meta:
        model = Rental
        fields = ['id', 'tenant_name', 'house_address', 'status', 'start_date', 'end_date']



class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = '__all__'

class ChatThreadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatThread
        fields = '__all__'

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


from rest_framework import serializers

class ImageUploadSerializer(serializers.Serializer):
    id_document = serializers.FileField(required=True)  # Изменено с "image" на "id_document"
    texts_to_find = serializers.ListField(
        child=serializers.CharField(max_length=255), required=True
    )


from rest_framework import serializers
from .models import CustomUser as User
from .models import PasswordChangeRequest

class RequestPasswordChangeSerializer(serializers.Serializer):
    email_or_username = serializers.CharField(required=False)

    def validate_email_or_username(self, value):
        request = self.context.get("request")
        if request and request.user:
            # Если пользователь находится в аккаунте, используем его email
            return request.user
        try:
            if "@" in value:
                user = User.objects.get(email=value)
            else:
                user = User.objects.get(username=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Пользователь не найден.")
        return user


class ConfirmPasswordChangeSerializer(serializers.Serializer):
    email_or_username = serializers.CharField(required=False)
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=8)

    def validate(self, data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            user = request.user
        else:
            try:
                if "@" in data['email_or_username']:
                    user = User.objects.get(email=data['email_or_username'])
                else:
                    user = User.objects.get(username=data['email_or_username'])
            except User.DoesNotExist:
                raise serializers.ValidationError("Пользователь не найден.")

        try:
            code_entry = PasswordChangeRequest.objects.get(user=user, code=data['code'], is_used=False)
        except PasswordChangeRequest.DoesNotExist:
            raise serializers.ValidationError("Неверный или использованный код.")

        data['user'] = user
        data['code_entry'] = code_entry
        return data



