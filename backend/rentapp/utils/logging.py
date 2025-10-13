"""
Утилиты для безопасного логирования.

Маскирует чувствительные данные перед записью в логи.
"""


def mask_sensitive_data(data, sensitive_keys=None):
    """
    Маскирует чувствительные данные перед логированием.
    
    Args:
        data: Данные для маскировки (dict, list, str или другой тип)
        sensitive_keys: Список ключей, которые нужно маскировать
    
    Returns:
        Данные с маскированными чувствительными полями
    
    Example:
        >>> data = {'username': 'john', 'password': 'secret123', 'email': 'john@example.com'}
        >>> mask_sensitive_data(data)
        {'username': 'john', 'password': '***MASKED***', 'email': 'john@example.com'}
    """
    if sensitive_keys is None:
        # Список чувствительных полей по умолчанию
        sensitive_keys = [
            'password', 'password1', 'password2', 'new_password', 'old_password',
            'token', 'access_token', 'refresh_token', 'api_key', 'secret_key',
            'identifier', 'documents', 'id_document', 'passport', 'iin', 'bin',
            'phone_number', 'phone', 'credit_card', 'card_number', 'cvv', 'ssn',
        ]
    
    if isinstance(data, dict):
        return {
            k: '***MASKED***' if k.lower() in [sk.lower() for sk in sensitive_keys] 
            else mask_sensitive_data(v, sensitive_keys)
            for k, v in data.items()
        }
    elif isinstance(data, list):
        return [mask_sensitive_data(item, sensitive_keys) for item in data]
    elif isinstance(data, tuple):
        return tuple(mask_sensitive_data(item, sensitive_keys) for item in data)
    else:
        return data


def mask_email(email):
    """
    Маскирует email адрес.
    
    Args:
        email: Email адрес для маскировки
    
    Returns:
        Маскированный email
    
    Example:
        >>> mask_email('john.doe@example.com')
        'j***@e***.com'
    """
    if not email or '@' not in email:
        return email
    
    parts = email.split('@')
    if len(parts) != 2:
        return email
    
    username = parts[0]
    domain = parts[1]
    
    # Маскируем username
    if len(username) > 2:
        masked_username = username[0] + '***'
    else:
        masked_username = username[0] + '***'
    
    # Маскируем domain
    domain_parts = domain.split('.')
    if len(domain_parts) >= 2:
        masked_domain = domain_parts[0][0] + '***.' + domain_parts[-1]
    else:
        masked_domain = domain[0] + '***'
    
    return f"{masked_username}@{masked_domain}"


def mask_phone(phone):
    """
    Маскирует номер телефона.
    
    Args:
        phone: Номер телефона для маскировки
    
    Returns:
        Маскированный номер
    
    Example:
        >>> mask_phone('+7 (777) 123-45-67')
        '+7 *** ***-**-67'
    """
    if not phone or len(phone) < 4:
        return phone
    
    # Оставляем первые 3 и последние 2 символа
    return phone[:3] + ' ***-**-' + phone[-2:]


def mask_identifier(identifier):
    """
    Маскирует ИИН/БИН или другой идентификатор.
    
    Args:
        identifier: Идентификатор для маскировки
    
    Returns:
        Маскированный идентификатор
    
    Example:
        >>> mask_identifier('123456789012')
        '***********12'
    """
    if not identifier or len(identifier) < 2:
        return identifier
    
    # Показываем только последние 2 символа
    return '*' * (len(identifier) - 2) + identifier[-2:]


def safe_log_request_data(request_data):
    """
    Безопасно логирует данные запроса.
    
    Args:
        request_data: Данные из request.data или request.POST
    
    Returns:
        Маскированные данные для логирования
    """
    return mask_sensitive_data(request_data)


def safe_log_user_info(user):
    """
    Безопасно логирует информацию о пользователе.
    
    Args:
        user: Объект CustomUser
    
    Returns:
        Безопасная информация о пользователе для логирования
    """
    return {
        'id': user.id,
        'username': user.username,
        'email': mask_email(user.email) if user.email else None,
        'phone': mask_phone(user.phone_number) if user.phone_number else None,
        'identifier': mask_identifier(user.identifier) if user.identifier else None,
        'role': user.role,
        'is_active': user.is_active,
    }

