"""
Тесты для моделей приложения rentapp
"""
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
from unittest.mock import patch, MagicMock
import tempfile
import os

from ..models import (
    CustomUser, House, Complaint, ComplaintReason, 
    IdentityVerification, Rental, Reputation, Comment,
    ComplaintDispute, RentalComplaint
)

User = get_user_model()


class CustomUserModelTest(TestCase):
    """Тесты для модели CustomUser"""
    
    def setUp(self):
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
    
    def test_create_user(self):
        """Тест создания пользователя"""
        user = CustomUser.objects.create_user(**self.user_data)
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.role, 'tenant')
        self.assertTrue(user.check_password('testpass123'))
    
    def test_user_str_representation(self):
        """Тест строкового представления пользователя"""
        user = CustomUser.objects.create_user(**self.user_data)
        expected = f"{user.first_name} {user.last_name} ({user.username})"
        self.assertEqual(str(user), expected)
    
    def test_phone_number_validation(self):
        """Тест валидации номера телефона"""
        # Валидный номер
        user = CustomUser.objects.create_user(**self.user_data)
        self.assertIsNotNone(user)
        
        # Невалидный номер
        invalid_data = self.user_data.copy()
        invalid_data['phone_number'] = 'invalid_phone'
        
        with self.assertRaises(ValidationError):
            user = CustomUser.objects.create_user(**invalid_data)
    
    def test_iin_validation(self):
        """Тест валидации ИИН"""
        # Валидный ИИН
        user = CustomUser.objects.create_user(**self.user_data)
        self.assertIsNotNone(user)
        
        # Невалидный ИИН (слишком короткий)
        invalid_data = self.user_data.copy()
        invalid_data['iin'] = '123'
        
        with self.assertRaises(ValidationError):
            user = CustomUser.objects.create_user(**invalid_data)


class HouseModelTest(TestCase):
    """Тесты для модели House"""
    
    def setUp(self):
        self.landlord = CustomUser.objects.create_user(
            username='landlord',
            email='landlord@example.com',
            password='testpass123',
            role='landlord'
        )
        
        self.house_data = {
            'owner': self.landlord,
            'address': 'Test Street 123',
            'type_p': 'apartment',
            'rooms': 3,
            'area': 75.5,
            'price': 150000,
            'description': 'Test apartment description'
        }
    
    def test_create_house(self):
        """Тест создания дома"""
        house = House.objects.create(**self.house_data)
        self.assertEqual(house.address, 'Test Street 123')
        self.assertEqual(house.owner, self.landlord)
        self.assertEqual(house.type_p, 'apartment')
        self.assertEqual(house.price, 150000)
    
    def test_house_str_representation(self):
        """Тест строкового представления дома"""
        house = House.objects.create(**self.house_data)
        expected = f"{house.address} - {house.type_p}"
        self.assertEqual(str(house), expected)
    
    def test_house_price_validation(self):
        """Тест валидации цены"""
        # Положительная цена
        house = House.objects.create(**self.house_data)
        self.assertGreater(house.price, 0)
        
        # Отрицательная цена должна вызывать ошибку
        invalid_data = self.house_data.copy()
        invalid_data['price'] = -1000
        
        with self.assertRaises(ValidationError):
            house = House.objects.create(**invalid_data)


class ComplaintModelTest(TestCase):
    """Тесты для модели Complaint"""
    
    def setUp(self):
        self.tenant = CustomUser.objects.create_user(
            username='tenant',
            email='tenant@example.com',
            password='testpass123',
            role='tenant'
        )
        
        self.landlord = CustomUser.objects.create_user(
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
            'tenant': self.tenant,
            'house': self.house,
            'title': 'Test Complaint',
            'description': 'Test complaint description',
            'status': 'pending'
        }
    
    def test_create_complaint(self):
        """Тест создания жалобы"""
        complaint = Complaint.objects.create(**self.complaint_data)
        self.assertEqual(complaint.title, 'Test Complaint')
        self.assertEqual(complaint.tenant, self.tenant)
        self.assertEqual(complaint.house, self.house)
        self.assertEqual(complaint.status, 'pending')
    
    def test_complaint_str_representation(self):
        """Тест строкового представления жалобы"""
        complaint = Complaint.objects.create(**self.complaint_data)
        expected = f"Complaint by {complaint.tenant.username} for {complaint.house.address}"
        self.assertEqual(str(complaint), expected)
    
    def test_complaint_status_choices(self):
        """Тест выбора статуса жалобы"""
        valid_statuses = ['pending', 'in_progress', 'resolved', 'rejected']
        
        for status in valid_statuses:
            complaint_data = self.complaint_data.copy()
            complaint_data['status'] = status
            complaint = Complaint.objects.create(**complaint_data)
            self.assertEqual(complaint.status, status)


class RentalModelTest(TestCase):
    """Тесты для модели Rental"""
    
    def setUp(self):
        self.tenant = CustomUser.objects.create_user(
            username='tenant',
            email='tenant@example.com',
            password='testpass123',
            role='tenant'
        )
        
        self.landlord = CustomUser.objects.create_user(
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
        
        rental = Rental.objects.create(
            tenant=self.tenant,
            house=self.house,
            start_date=start_date,
            end_date=end_date,
            monthly_rent=150000,
            status='active'
        )
        
        self.assertEqual(rental.tenant, self.tenant)
        self.assertEqual(rental.house, self.house)
        self.assertEqual(rental.status, 'active')
    
    def test_rental_date_validation(self):
        """Тест валидации дат аренды"""
        start_date = date.today()
        end_date = start_date - timedelta(days=1)  # Конец раньше начала
        
        with self.assertRaises(ValidationError):
            Rental.objects.create(
                tenant=self.tenant,
                house=self.house,
                start_date=start_date,
                end_date=end_date,
                monthly_rent=150000,
                status='active'
            )


class ReputationModelTest(TestCase):
    """Тесты для модели Reputation"""
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='tenant'
        )
    
    def test_create_reputation(self):
        """Тест создания репутации"""
        reputation = Reputation.objects.create(
            user=self.user,
            rating=4.5,
            comment='Good tenant'
        )
        
        self.assertEqual(reputation.user, self.user)
        self.assertEqual(reputation.rating, 4.5)
        self.assertEqual(reputation.comment, 'Good tenant')
    
    def test_rating_validation(self):
        """Тест валидации рейтинга"""
        # Валидный рейтинг
        reputation = Reputation.objects.create(
            user=self.user,
            rating=3.0,
            comment='Average'
        )
        self.assertIsNotNone(reputation)
        
        # Невалидный рейтинг (больше 5)
        with self.assertRaises(ValidationError):
            Reputation.objects.create(
                user=self.user,
                rating=6.0,
                comment='Invalid rating'
            )
        
        # Невалидный рейтинг (меньше 0)
        with self.assertRaises(ValidationError):
            Reputation.objects.create(
                user=self.user,
                rating=-1.0,
                comment='Invalid rating'
            )


class IdentityVerificationModelTest(TestCase):
    """Тесты для модели IdentityVerification"""
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='tenant'
        )
    
    @patch('rentapp.models.IdentityVerification.document')
    def test_create_identity_verification(self, mock_document):
        """Тест создания верификации личности"""
        mock_document.name = 'test_document.jpg'
        
        verification = IdentityVerification.objects.create(
            user=self.user,
            document_type='id_card',
            status='pending'
        )
        
        self.assertEqual(verification.user, self.user)
        self.assertEqual(verification.document_type, 'id_card')
        self.assertEqual(verification.status, 'pending')
    
    def test_verification_status_choices(self):
        """Тест выбора статуса верификации"""
        valid_statuses = ['pending', 'approved', 'rejected']
        
        for status in valid_statuses:
            verification = IdentityVerification.objects.create(
                user=self.user,
                document_type='id_card',
                status=status
            )
            self.assertEqual(verification.status, status)
