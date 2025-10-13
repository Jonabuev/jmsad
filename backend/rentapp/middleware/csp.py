"""
Content Security Policy (CSP) Middleware
Защита от XSS атак через ограничение источников контента
"""


class CSPMiddleware:
    """
    Добавляет Content-Security-Policy заголовок к каждому HTTP-ответу
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Определяем политику безопасности контента
        # Настройте под свои нужды!
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google.com https://accounts.google.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: http:",
            "connect-src 'self' https://api.arno.kz https://arno.kz https://www.google.com https://accounts.google.com",
            "frame-src 'self' https://www.google.com https://accounts.google.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
        ]
        
        # Объединяем директивы в один заголовок
        csp_header = "; ".join(csp_directives)
        
        # Добавляем CSP заголовок
        response['Content-Security-Policy'] = csp_header
        
        # Дополнительные заголовки безопасности
        response['X-Content-Type-Options'] = 'nosniff'  # Защита от MIME-sniffing
        response['X-Frame-Options'] = 'DENY'  # Защита от clickjacking
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'  # Контроль Referer
        
        return response

