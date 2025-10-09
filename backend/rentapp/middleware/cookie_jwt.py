"""
Middleware для чтения JWT токенов из cookies
Если токен отсутствует в заголовке Authorization, пытается прочитать из cookies
"""

class CookieJWTMiddleware:
    """
    Middleware, которое проверяет наличие JWT токена в cookies
    и добавляет его в заголовок Authorization, если его там нет.
    
    Это позволяет использовать cookies для аутентификации вместо
    передачи токена в заголовке Authorization.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Проверяем, есть ли уже заголовок Authorization
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        # Если заголовка нет или он пустой, пытаемся прочитать из cookies
        if not auth_header or not auth_header.startswith('Bearer '):
            # Получаем access token из cookies
            access_token = request.COOKIES.get('access_token')
            
            if access_token:
                # Добавляем токен в заголовок Authorization
                request.META['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
                
                # Логируем для отладки (можно убрать в production)
                # print(f"🍪 JWT токен прочитан из cookies для пути: {request.path}")
        
        response = self.get_response(request)
        return response

