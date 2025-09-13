import requests
import json

# Тестовые данные для регистрации
test_data = {
    "username": "testuser123",
    "email": "test@example.com",
    "password1": "testpass123",
    "password2": "testpass123",
    "role": "tenant"
}

# URL для регистрации
url = "http://127.0.0.1:8000/api/register/"

print("🧪 Тестируем API регистрации...")
print(f"URL: {url}")
print(f"Данные: {json.dumps(test_data, indent=2)}")

try:
    # Отправляем POST запрос
    response = requests.post(url, json=test_data, headers={
        'Content-Type': 'application/json'
    })
    
    print(f"\n📊 Статус ответа: {response.status_code}")
    print(f"📋 Заголовки ответа: {dict(response.headers)}")
    
    try:
        response_data = response.json()
        print(f"📄 Тело ответа: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
    except:
        print(f"📄 Текст ответа: {response.text}")
        
except requests.exceptions.ConnectionError as e:
    print(f"❌ Ошибка подключения: {e}")
except requests.exceptions.RequestException as e:
    print(f"❌ Ошибка запроса: {e}")
except Exception as e:
    print(f"❌ Неожиданная ошибка: {e}")

