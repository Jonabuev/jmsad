from rest_framework import generics, permissions, filters
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework import status
from django.core.exceptions import ValidationError
from django.db.models import Q, Prefetch
from rentapp.models import RentalComplaint, House
from rentapp.serializers import RentalComplaintSerializer
from rentapp.services.forum_service import ForumService
from rentapp.exceptions import RentAppException
from rentapp.cache import ForumCache, HouseCache
from django_filters.rest_framework import DjangoFilterBackend
from rentapp.permissions import IsOwner, IsLandlord, IsTenant, IsOwnerOrReadOnly

class ForumView(generics.ListAPIView):
    """
    API endpoint для получения списка постов форума.
    
    GET: Возвращает список постов с фильтрацией
    
    Query Parameters:
        - filter: Тип фильтрации (popular, new, old)
        - region: Фильтр по региону
        - city: Фильтр по городу
        - district: Фильтр по району
        - address: Поиск по адресу
    
    Permissions:
        - Доступно всем пользователям
    """
    serializer_class = RentalComplaintSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'rental__house__region', 'rental__house__city', 'rental__house__district']
    search_fields = ['rental__house__address', 'complainant__username', 'accused__username', 'description']
    ordering_fields = ['created_at', 'support_count']

    def get_queryset(self):
        filter_type = self.request.query_params.get('filter', 'popular')
        region = self.request.query_params.get('region')
        city = self.request.query_params.get('city')
        district = self.request.query_params.get('district')
        address = self.request.query_params.get('address')

        qs = RentalComplaint.objects.select_related(
            'rental', 'rental__house', 'rental__house__owner',
            'complainant', 'accused'
        ).prefetch_related(
            'reasons', 'comments', 'comments__user'
        ).filter(status='reviewed')

        # Apply geographic filters
        if region:
            qs = qs.filter(rental__house__region__iexact=region)
        if city:
            qs = qs.filter(rental__house__city__iexact=city)
        if district:
            qs = qs.filter(rental__house__district__iexact=district)
        
        # Apply address search
        if address:
            qs = qs.filter(rental__house__address__icontains=address)

        # Apply sorting
        if filter_type == 'new':
            return qs.order_by('-created_at')
        elif filter_type == 'old':
            return qs.order_by('created_at')
        return qs.order_by('-support_count')


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_location_filters(request):
    """
    API endpoint для получения фильтров по местоположению.
    
    GET: Возвращает списки регионов, городов и районов
    
    Permissions:
        - Доступно всем пользователям
    """
    # Используем кэширование для фильтров локации
    filters_data = HouseCache.get_location_filters()
    return Response(filters_data)


class ForumPostListView(generics.ListAPIView):
    """
    API endpoint для получения списка постов форума.
    
    GET: Возвращает список постов с фильтрацией
    
    Query Parameters:
        - category: Фильтр по категории
        - search: Поиск по тексту
        - author_id: Фильтр по автору
    
    Permissions:
        - Доступно всем пользователям
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            category = request.query_params.get('category')
            search = request.query_params.get('search')
            author_id = request.query_params.get('author_id')
            
            posts = ForumService.get_forum_posts(category, search, author_id)
            return Response(posts)
        except RentAppException as e:
            return Response({'error': e.message}, status=status.HTTP_400_BAD_REQUEST)


class ForumPostDetailView(APIView):
    """
    API endpoint для получения деталей поста форума.
    
    GET: Возвращает детали поста с комментариями
    
    Permissions:
        - Доступно всем пользователям
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, post_id):
        try:
            post_data = ForumService.get_forum_post(post_id)
            return Response(post_data)
        except RentAppException as e:
            return Response({'error': e.message}, status=status.HTTP_404_NOT_FOUND)


class CreateForumPostView(APIView):
    """
    API endpoint для создания поста форума.
    
    POST: Создает новый пост
    
    Required fields:
        - title: Заголовок поста
        - content: Содержание поста
        - category: Категория (опционально)
    
    Permissions:
        - Требуется аутентификация
    """
    permission_classes = [permissions.IsAuthenticated, IsTenant | IsLandlord]

    def post(self, request):
        try:
            result = ForumService.create_forum_post(request.data, request.user)
            return Response(result, status=status.HTTP_201_CREATED)
        except RentAppException as e:
            return Response({'error': e.message}, status=status.HTTP_400_BAD_REQUEST)


class AddForumCommentView(APIView):
    """
    API endpoint для добавления комментария к посту.
    
    POST: Добавляет комментарий к посту
    
    Required fields:
        - content: Содержание комментария
    
    Permissions:
        - Требуется аутентификация
    """
    permission_classes = [permissions.IsAuthenticated, IsTenant | IsLandlord]

    def post(self, request, post_id):
        try:
            result = ForumService.add_forum_comment(post_id, request.data.get('content'), request.user)
            return Response(result, status=status.HTTP_201_CREATED)
        except RentAppException as e:
            return Response({'error': e.message}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_forum_categories(request):
    """
    API endpoint для получения списка категорий форума.
    
    GET: Возвращает список доступных категорий
    
    Permissions:
        - Доступно всем пользователям
    """
    # Используем кэширование для категорий форума
    categories = ForumCache.get_forum_categories()
    return Response(categories)





