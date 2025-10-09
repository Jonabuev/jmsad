from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rentapp.forms import CustomUserCreationForm
from rentapp.models import PasswordChangeRequest, CustomUser
from rentapp.serializers import RequestPasswordChangeSerializer, ConfirmPasswordChangeSerializer
from rentapp.utils import generate_code, send_confirmation_code
from rentapp.notifications import create_notification
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
import requests
from rest_framework_simplejwt.views import TokenObtainPairView


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    API endpoint для регистрации нового пользователя.
    
    Создает нового пользователя с валидацией данных через форму.
    Автоматически генерирует JWT токены для аутентификации.
    
    Required fields:
        - username: Имя пользователя
        - email: Email адрес
        - password1: Пароль
        - password2: Подтверждение пароля
        - role: Роль пользователя (tenant/landlord)
    
    Returns:
        - access_token: JWT токен для доступа
        - refresh_token: JWT токен для обновления
        - profile_url: Ссылка на профиль пользователя
    
    Permissions:
        - Доступно всем пользователям
    """
    print("Полученные данные:", request.data)

    form = CustomUserCreationForm(data=request.data)

    if form.is_valid():
        # Сохраняем пользователя (и автоматически выставляем type_identify)
        user = form.save()  # ✅ теперь сохраняется сразу

        # Генерация JWT токенов
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        profile_url = f"http://localhost:3000/profile/"

        # Создаем уведомление о регистрации (в базе)
        try:
            create_notification(
                user=user,
                notification_type='complaint_received',  # используем существующий тип как общий
                title='Добро пожаловать!',
                message='Ваш аккаунт успешно зарегистрирован.'
            )
        except Exception as e:
            # Не блокируем регистрацию из-за уведомлений
            print('Ошибка создания уведомления при регистрации:', e)
        
        # Логируем регистрацию
        try:
            from rentapp.utils import log_activity
            log_activity(
                action_type='user_register',
                description=f'Новый пользователь зарегистрирован: {user.username} ({user.email}), роль: {user.get_role_display()}',
                user=user,
                target_object=user,
                request=request,
                metadata={
                    'user_id': user.id,
                    'role': user.role,
                    'email': user.email,
                    'username': user.username
                }
            )
        except Exception as e:
            print('Ошибка логирования регистрации:', e)

        return Response({
            "message": "Пользователь успешно зарегистрирован",
            "access_token": access_token,
            "refresh_token": str(refresh),
            "profile_url": profile_url,
        }, status=status.HTTP_201_CREATED)

    print("Ошибка в данных формы:", form.errors)
    return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    API endpoint для аутентификации пользователя.
    
    Проверяет учетные данные пользователя и возвращает JWT токены.
    
    Required fields:
        - username: Имя пользователя или email
        - password: Пароль пользователя
    
    Returns:
        - access_token: JWT токен для доступа
        - refresh_token: JWT токен для обновления
        - profile_url: Ссылка на профиль пользователя
    
    Permissions:
        - Доступно всем пользователям
    """
    # Логируем полученные данные для отладки
    print("Попытка логина с данными:", request.data)

    # Получаем данные из запроса
    username = request.data.get('username')
    password = request.data.get('password')

    # Аутентификация пользователя
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        # Проверяем, не заблокирован ли пользователь
        if user.is_banned:
            return Response({
                "error": "Ваш аккаунт заблокирован. Обратитесь к администратору."
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Проверяем, активен ли пользователь
        if not user.is_active:
            return Response({
                "error": "Ваш аккаунт деактивирован. Обратитесь к администратору."
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Пользователь прошел аутентификацию, генерируем токены
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        # Логируем вход в систему
        try:
            from rentapp.utils import log_activity
            log_activity(
                action_type='user_login',
                description=f'Пользователь {user.username} ({user.email}) вошел в систему',
                user=user,
                target_object=None,
                request=request,
                metadata={
                    'user_id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role
                }
            )
        except Exception as e:
            print('Ошибка логирования входа:', e)

        # Создаем успешный ответ с токенами
        profile_url = f"http://localhost:3000/profile/"
        response = Response({
            "message": "Логин успешен",
            "access_token": access_token,
            "refresh_token": str(refresh),
            "profile_url": profile_url,
        }, status=status.HTTP_200_OK)
        
        # Устанавливаем токены в cookies
        # Access token (5 часов = 300 минут)
        response.set_cookie(
            key='access_token',
            value=access_token,
            max_age=300 * 60,  # 5 часов в секундах
            httponly=False,  # Нужен False чтобы frontend мог читать
            secure=False,  # False для localhost (без HTTPS)
            samesite='Lax',
            path='/'
        )
        
        # Refresh token (3 дня)
        response.set_cookie(
            key='refresh_token',
            value=str(refresh),
            max_age=3 * 24 * 60 * 60,  # 3 дня в секундах
            httponly=False,  # Нужен False чтобы frontend мог читать
            secure=False,  # False для localhost
            samesite='Lax',
            path='/'
        )
        
        return response
    else:
        # Неверные учетные данные
        return Response({
            "error": "Неверное имя пользователя или пароль"
        }, status=status.HTTP_401_UNAUTHORIZED)




User = CustomUser

@permission_classes([AllowAny])
class RequestPasswordResetView(APIView):
    """
    API endpoint для запроса сброса пароля.
    
    Отправляет код подтверждения на email пользователя для сброса пароля.
    
    Required fields:
        - email: Email адрес пользователя
        - или username: Имя пользователя
    
    Permissions:
        - Доступно всем пользователям
    """
    def post(self, request):
        email_or_username = request.data.get('email') or request.data.get('username')

        if not email_or_username:
            return Response({'error': 'Email or username is required'}, status=400)

        try:
            user = User.objects.get(email=email_or_username) if '@' in email_or_username else User.objects.get(username=email_or_username)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        code = generate_code()
        PasswordChangeRequest.objects.create(user=user, code=code)
        send_confirmation_code(user.email, code)

        return Response({'success': 'Confirmation code sent to your email'}, status=200)


@permission_classes([AllowAny])
class RequestPasswordChangeView(APIView):
    """
    API endpoint для запроса смены пароля авторизованным пользователем.
    
    Отправляет код подтверждения на email текущего пользователя для смены пароля.
    
    Permissions:
        - Требуется аутентификация
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        code = generate_code()
        PasswordChangeRequest.objects.create(user=user, code=code)
        send_confirmation_code(user.email, code)

        return Response({'success': 'Confirmation code sent to your email'}, status=200)

@permission_classes([AllowAny])
class ConfirmPasswordChangeView(APIView):
    """
    API endpoint для подтверждения смены пароля.
    
    Подтверждает код и изменяет пароль пользователя.
    
    Required fields:
        - code: Код подтверждения
        - new_password: Новый пароль
        - email: Email пользователя (для сброса пароля)
    
    Permissions:
        - Для сброса пароля: доступно всем
        - Для смены пароля: требуется аутентификация
    """
    def post(self, request):
        code = request.data.get('code')
        new_password = request.data.get('new_password')
        email = request.data.get('email')  # Добавляем email для случая сброса пароля

        if not code or not new_password:
            return Response({'error': 'Требуется код и новый пароль'}, status=400)

        try:
            if email:
                # Случай сброса пароля через email
                user = User.objects.get(email=email)
                req_obj = PasswordChangeRequest.objects.get(
                    user=user,
                    code=code,
                    is_used=False
                )
            else:
                # Случай смены пароля авторизованным пользователем
                if not request.user.is_authenticated:
                    return Response({'error': 'Требуется авторизация'}, status=401)
                req_obj = PasswordChangeRequest.objects.get(
                    user=request.user,
                    code=code,
                    is_used=False
                )
                user = request.user

        except (User.DoesNotExist, PasswordChangeRequest.DoesNotExist):
            return Response({'error': 'Неверный или использованный код'}, status=400)

        # Проверяем, не истек ли срок действия кода (10 минут)
        if req_obj.is_expired():
            return Response({'error': 'Срок действия кода истек'}, status=400)
        
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response({'error': e.messages}, status=400)


        # Меняем пароль
        user.set_password(new_password)
        user.save()

        # Помечаем код как использованный
        req_obj.is_used = True
        req_obj.save()

        return Response({'success': 'Пароль успешно изменен'}, status=200)


CustomUser = get_user_model()
@method_decorator(csrf_exempt, name='dispatch')
class GoogleAuthView(APIView):
    """
    API endpoint для аутентификации через Google OAuth.
    
    Проверяет Google ID токен и создает/находит пользователя в системе.
    Возвращает JWT токены для дальнейшей работы.
    
    Required fields:
        - token: Google ID токен
    
    Returns:
        - access: JWT токен для доступа
        - refresh: JWT токен для обновления
        - user: Информация о пользователе
    
    Permissions:
        - Доступно всем пользователям
    """
    permission_classes = [AllowAny]
    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'No token provided'}, status=400)

        # Проверка токена через Google API
        google_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        google_response = requests.get(google_url)
        if google_response.status_code != 200:
            return Response({'error': 'Invalid token'}, status=400)

        google_data = google_response.json()
        email = google_data.get('email')
        name = google_data.get('name')

        if not email:
            return Response({'error': 'Email not found in token'}, status=400)

        # Находим или создаем пользователя
        # Находим или создаем пользователя
        user, created = CustomUser.objects.get_or_create(
            email=email,
            defaults={'username': name}  # или email.split('@')[0], если хочешь
        )

        # Выдаем JWT токены
        refresh = RefreshToken.for_user(user)
        
        response = Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.username,
            }
        })
        
        # Устанавливаем токены в cookies
        # Access token (5 часов)
        response.set_cookie(
            key='access_token',
            value=str(refresh.access_token),
            max_age=300 * 60,  # 5 часов
            httponly=False,  # False чтобы frontend мог читать
            secure=False,  # False для localhost
            samesite='Lax',
            path='/'
        )
        
        # Refresh token (3 дня)
        response.set_cookie(
            key='refresh_token',
            value=str(refresh),
            max_age=3 * 24 * 60 * 60,  # 3 дня
            httponly=False,
            secure=False,
            samesite='Lax',
            path='/'
        )
        
        return response

# Представление для обновления токена
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    API endpoint для получения JWT токенов.
    
    Стандартный endpoint DRF для получения access и refresh токенов.
    Расширяет базовый TokenObtainPairView для кастомизации при необходимости.
    
    Required fields:
        - username: Имя пользователя
        - password: Пароль пользователя
    
    Returns:
        - access: JWT токен для доступа
        - refresh: JWT токен для обновления
    
    Permissions:
        - Доступно всем пользователям
    """
    pass



