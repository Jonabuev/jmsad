"""
Тесты для API endpoints приложения rentapp
"""
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from datetime import date, timedelta
import json

from ..models import House, Complaint, Rental, Reputation, IdentityVerification

User = get_user_model()


class AuthenticationAPITest(APITestCase):
    """Тесты для API аутентификации"""
    
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'tenant',
            'phone_number': '+77001234567',
            'iin': '123456789012'
        }
    
    def test_user_registration(self):
        """Тест регистрации пользователя"""
        url = reverse('register')
        response = self.client.post(url, self.user_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='testuser').exists())
    
    def test_user_login(self):
        """Тест входа пользователя"""
        # Создаем пользователя
        user = User.objects.create_user(**self.user_data)
        
        # Логинимся
        login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        url = reverse('login')
        response = self.client.post(url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_invalid_login(self):
        """Тест входа с неверными данными"""
        login_data = {
            'username': 'nonexistent',
            'password': 'wrongpassword'
        }
        url = reverse('login')
        response = self.client.post(url, login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class HouseAPITest(APITestCase):
    """Тесты для API домов"""
    
    def setUp(self):
        self.client = APIClient()
        self.landlord = User.objects.create_user(
            username='landlord',
            email='landlord@example.com',
            password='testpass123',
            role='landlord'
        )
        
        self.tenant = User.objects.create_user(
            username='tenant',
            email='tenant@example.com',
            password='testpass123',
            role='tenant'
        )
        
        self.house_data = {
            'address': 'Test Street 123',
            'type_p': 'apartment',
            'rooms': 3,
            'area': 75.5,
            'price': 150000,
            'description': 'Test apartment description'
        }
    
    def test_create_house_authenticated(self):
        """Тест создания дома авторизованным пользователем"""
        self.client.force_authenticate(user=self.landlord)
        url = reverse('house-list')
        response = self.client.post(url, self.house_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['address'], 'Test Street 123')
        self.assertEqual(response.data['owner'], self.landlord.id)
    
    def test_create_house_unauthenticated(self):
        """Тест создания дома неавторизованным пользователем"""
        url = reverse('house-list')
        response = self.client.post(url, self.house_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_houses(self):
        """Тест получения списка домов"""
        # Создаем дом
        House.objects.create(owner=self.landlord, **self.house_data)
        
        url = reverse('house-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_get_house_detail(self):
        """Тест получения детальной информации о доме"""
        house = House.objects.create(owner=self.landlord, **self.house_data)
        
        url = reverse('house-detail', kwargs={'pk': house.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['address'], 'Test Street 123')
    
    def test_update_house_owner(self):
        """Тест обновления дома владельцем"""
        house = House.objects.create(owner=self.landlord, **self.house_data)
        
        self.client.force_authenticate(user=self.landlord)
        url = reverse('house-detail', kwargs={'pk': house.pk})
        update_data = {'price': 200000}
        response = self.client.patch(url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['price'], 200000)
    
    def test_update_house_non_owner(self):
        """Тест обновления дома не владельцем"""
        house = House.objects.create(owner=self.landlord, **self.house_data)
        
        self.client.force_authenticate(user=self.tenant)
        url = reverse('house-detail', kwargs={'pk': house.pk})
        update_data = {'price': 200000}
        response = self.client.patch(url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ComplaintAPITest(APITestCase):
    """Тесты для API жалоб"""
    
    def setUp(self):
        self.client = APIClient()
        self.tenant = User.objects.create_user(
            username='tenant',
            email='tenant@example.com',
            password='testpass123',
            role='tenant'
        )
        
        self.landlord = User.objects.create_user(
            username='landlord',
            email='landlord@example.com',
            password='testpass123',
            role='landlord'
        )
        
        self.house = House.objects.create(
            owner=self.landlord,
            address='Test Street 123',
            type_p='apartment',
            rooms=3,
            area=75.5,
            price=150000
        )
        
        self.complaint_data = {
            'house': self.house.id,
            'title': 'Test Complaint',
            'description': 'Test complaint description'
        }
    
    def test_create_complaint_authenticated(self):
        """Тест создания жалобы авторизованным пользователем"""
        self.client.force_authenticate(user=self.tenant)
        url = reverse('complaint-list')
        response = self.client.post(url, self.complaint_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Test Complaint')
        self.assertEqual(response.data['tenant'], self.tenant.id)
    
    def test_create_complaint_unauthenticated(self):
        """Тест создания жалобы неавторизованным пользователем"""
        url = reverse('complaint-list')
        response = self.client.post(url, self.complaint_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_complaints(self):
        """Тест получения списка жалоб"""
        # Создаем жалобу
        Complaint.objects.create(
            tenant=self.tenant,
            house=self.house,
            title='Test Complaint',
            description='Test description'
        )
        
        url = reverse('complaint-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_update_complaint_status(self):
        """Тест обновления статуса жалобы"""
        complaint = Complaint.objects.create(
            tenant=self.tenant,
            house=self.house,
            title='Test Complaint',
            description='Test description'
        )
        
        # Обновляем статус как арендодатель
        self.client.force_authenticate(user=self.landlord)
        url = reverse('complaint-detail', kwargs={'pk': complaint.pk})
        update_data = {'status': 'in_progress'}
        response = self.client.patch(url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'in_progress')


class RentalAPITest(APITestCase):
    """Тесты для API аренды"""
    
    def setUp(self):
        self.client = APIClient()
        self.tenant = User.objects.create_user(
            username='tenant',
            email='tenant@example.com',
            password='testpass123',
            role='tenant'
        )
        
        self.landlord = User.objects.create_user(
            username='landlord',
            email='landlord@example.com',
            password='testpass123',
            role='landlord'
        )
        
        self.house = House.objects.create(
            owner=self.landlord,
            address='Test Street 123',
            type_p='apartment',
            rooms=3,
            area=75.5,
            price=150000
        )
    
    def test_create_rental(self):
        """Тест создания аренды"""
        start_date = date.today()
        end_date = start_date + timedelta(days=30)
        
        rental_data = {
            'house': self.house.id,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'monthly_rent': 150000
        }
        
        self.client.force_authenticate(user=self.tenant)
        url = reverse('rental-list')
        response = self.client.post(url, rental_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tenant'], self.tenant.id)
        self.assertEqual(response.data['house'], self.house.id)
    
    def test_rental_date_validation(self):
        """Тест валидации дат аренды"""
        start_date = date.today()
        end_date = start_date - timedelta(days=1)  # Конец раньше начала
        
        rental_data = {
            'house': self.house.id,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'monthly_rent': 150000
        }
        
        self.client.force_authenticate(user=self.tenant)
        url = reverse('rental-list')
        response = self.client.post(url, rental_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ReputationAPITest(APITestCase):
    """Тесты для API репутации"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='tenant'
        )
        
        self.reviewer = User.objects.create_user(
            username='reviewer',
            email='reviewer@example.com',
            password='testpass123',
            role='landlord'
        )
    
    def test_create_reputation(self):
        """Тест создания репутации"""
        reputation_data = {
            'user': self.user.id,
            'rating': 4.5,
            'comment': 'Good tenant'
        }
        
        self.client.force_authenticate(user=self.reviewer)
        url = reverse('reputation-list')
        response = self.client.post(url, reputation_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['rating'], 4.5)
        self.assertEqual(response.data['comment'], 'Good tenant')
    
    def test_reputation_rating_validation(self):
        """Тест валидации рейтинга"""
        reputation_data = {
            'user': self.user.id,
            'rating': 6.0,  # Невалидный рейтинг
            'comment': 'Invalid rating'
        }
        
        self.client.force_authenticate(user=self.reviewer)
        url = reverse('reputation-list')
        response = self.client.post(url, reputation_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class IdentityVerificationAPITest(APITestCase):
    """Тесты для API верификации личности"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='tenant'
        )
    
    def test_create_identity_verification(self):
        """Тест создания верификации личности"""
        verification_data = {
            'document_type': 'id_card',
            'status': 'pending'
        }
        
        self.client.force_authenticate(user=self.user)
        url = reverse('identity-verification-list')
        response = self.client.post(url, verification_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['document_type'], 'id_card')
        self.assertEqual(response.data['status'], 'pending')
    
    def test_update_verification_status(self):
        """Тест обновления статуса верификации"""
        verification = IdentityVerification.objects.create(
            user=self.user,
            document_type='id_card',
            status='pending'
        )
        
        self.client.force_authenticate(user=self.user)
        url = reverse('identity-verification-detail', kwargs={'pk': verification.pk})
        update_data = {'status': 'approved'}
        response = self.client.patch(url, update_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'approved')
