import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from rentapp.permissions import IsOwner, IsLandlord, IsTenant, IsOwnerOrReadOnly

User = get_user_model()

class DummyObj:
    def __init__(self, owner):
        self.owner = owner

@pytest.fixture
def user_tenant():
    return User(username='tenant', role='tenant', id=1)

@pytest.fixture
def user_landlord():
    return User(username='landlord', role='landlord', id=2)

@pytest.fixture
def dummy_obj(user_landlord):
    return DummyObj(owner=user_landlord)

def test_is_owner_true(user_landlord, dummy_obj):
    factory = APIRequestFactory()
    request = factory.get('/')
    request.user = user_landlord
    perm = IsOwner()
    assert perm.has_object_permission(request, None, dummy_obj) is True

def test_is_owner_false(user_tenant, dummy_obj):
    factory = APIRequestFactory()
    request = factory.get('/')
    request.user = user_tenant
    perm = IsOwner()
    assert perm.has_object_permission(request, None, dummy_obj) is False

def test_is_landlord_true(user_landlord):
    factory = APIRequestFactory()
    request = factory.get('/')
    request.user = user_landlord
    perm = IsLandlord()
    assert perm.has_permission(request, None) is True

def test_is_landlord_false(user_tenant):
    factory = APIRequestFactory()
    request = factory.get('/')
    request.user = user_tenant
    perm = IsLandlord()
    assert perm.has_permission(request, None) is False

def test_is_tenant_true(user_tenant):
    factory = APIRequestFactory()
    request = factory.get('/')
    request.user = user_tenant
    perm = IsTenant()
    assert perm.has_permission(request, None) is True

def test_is_tenant_false(user_landlord):
    factory = APIRequestFactory()
    request = factory.get('/')
    request.user = user_landlord
    perm = IsTenant()
    assert perm.has_permission(request, None) is False

def test_is_owner_or_read_only_safe_method(user_tenant, dummy_obj):
    factory = APIRequestFactory()
    request = factory.get('/')
    request.user = user_tenant
    request.method = 'GET'
    perm = IsOwnerOrReadOnly()
    assert perm.has_object_permission(request, None, dummy_obj) is True

def test_is_owner_or_read_only_not_owner(user_tenant, dummy_obj):
    factory = APIRequestFactory()
    request = factory.post('/')
    request.user = user_tenant
    request.method = 'POST'
    perm = IsOwnerOrReadOnly()
    assert perm.has_object_permission(request, None, dummy_obj) is False

def test_is_owner_or_read_only_owner(user_landlord, dummy_obj):
    factory = APIRequestFactory()
    request = factory.put('/')
    request.user = user_landlord
    request.method = 'PUT'
    perm = IsOwnerOrReadOnly()
    assert perm.has_object_permission(request, None, dummy_obj) is True 