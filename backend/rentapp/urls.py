from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import AvailableHousesView, ChatMessageListCreateView, ChatThreadListCreateView, ConfirmPasswordChangeView, CreateRentalRequest, CustomTokenObtainPairView, FavoriteListCreateView, MyRentalsAPIView, NotificationListView, PublicUserProfileView, RentalDetailView, RentalListCreateView, RentalRequestListView, RequestPasswordChangeView, RequestPasswordResetView, get_location_filters, house_locations, profile_view
from . import views
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CreateComplaintAPIView,
    ForumView,
    AddCommentAPIView,
    SupportComplaintAPIView,
    RecommendTenantsAPIView,
    TenantRegistryView,
    TenantRegistryView1,
    GoogleAuthView,
    ComplaintDetailByUUIDView,
    OCRCheckView,
    ROCImageAPIView,
    NotificationMarkAsReadView
)



urlpatterns = [
    # Получение токенов
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    path('apartments/create/', views.create_apartment, name='create_apartment'),
    path('apartments/', views.user_apartments, name='user_apartments'),
    path('verify-identity/', views.verify_identity, name='verify_identity'),
    path('verify-identity1/', OCRCheckView.as_view(), name='verify_identity1'),
    path('complaints/<int:complaint_id>/update/', views.update_complaint_status, name='update_complaint_status'),
    path('complaints/submit/', views.submit_complaint, name='submit_complaint'),
    path('house-locations/', house_locations, name='house-locations'),
    path('complaint-reasons/', views.complaint_reasons, name='complaint_reasons'),
    path('tenant-registry/', TenantRegistryView.as_view(), name='tenant_registry'),
    path('user/profile/<str:username>/', PublicUserProfileView.as_view(), name='public_user_profile'),
    path('tenant-registry1/', TenantRegistryView1.as_view(), name='tenant_registry'),
    path('complaint/<int:complaint_id>/comment/', AddCommentAPIView.as_view(), name='add_comment'),
    path('support-complaint/', SupportComplaintAPIView.as_view(), name='support_complaint'),
    path('recommend-tenants/', RecommendTenantsAPIView.as_view(), name='recommend_tenants'),
    path('forum/', ForumView.as_view(), name='forum'),
    path('forum/filters/', get_location_filters, name='forum-filters'),
    path('analitics/', RecommendTenantsAPIView.as_view(), name='analitics'),
    path('analiticsML/', views.evaluate_reliability, name='analitics'),
    path('forum-add/<int:complaint_id>/', AddCommentAPIView.as_view(), name='forum_add'),
    path("complaints/<int:pk>/status/", views.update_complaint_status, name="update_complaint_status"),
    path("complaints1/<int:pk>/status/", views.update_complaint_status1, name="update_complaint_status1"),
    path('complaints/<int:complaint_id>/dispute/', views.dispute_complaint),
    path("api/user-info/", views.user_info),
    path('auth/google/', GoogleAuthView.as_view(), name='google-auth'),
    path('complaints/<uuid:uuid>/', ComplaintDetailByUUIDView.as_view(), name='complaint-detail'),
    path('register/', views.register, name='register'),
    path('rental-complaints/create/', views.createRentalComplaint, name='create_rental_complaint'),
    path("my-rentals/", MyRentalsAPIView.as_view(), name="my-rentals"),
    path('rentals/', RentalListCreateView.as_view(), name='rental-list-create'),
    path('rentals/<int:pk>/', RentalDetailView.as_view(), name='rental-detail'),
    path('rental-requests/', RentalRequestListView.as_view(), name='rental-requests'),
    path('rent-house/', CreateRentalRequest.as_view(), name='rental-house'),
    path('roc-curve/', ROCImageAPIView.as_view(), name='roc-image'),


    path('favorites/', FavoriteListCreateView.as_view(), name='favorite-list-create'),

    path('chat-threads/', ChatThreadListCreateView.as_view(), name='chat-thread-list-create'),
    path('chat-messages/<int:thread_id>/', ChatMessageListCreateView.as_view(), name='chat-message-list-create'),

    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/mark-as-read/', NotificationMarkAsReadView.as_view(), name='notification-mark-as-read'),

    path('available-houses/', AvailableHousesView.as_view(), name='available-houses'),

    path('request-password-reset/', RequestPasswordResetView.as_view()),
    path('request-password-change/', RequestPasswordChangeView.as_view()),
    path('confirm-password-change/', ConfirmPasswordChangeView.as_view()),
    
    # Профиль пользователя
    path('profile/', views.profile, name='profile'),
    path('login/', views.login_view, name='login'),
    
    path('rentals/<int:rental_id>/confirm/', views.confirm_rental, name='confirm-rental'),
    path('rentals/<int:rental_id>/reject/', views.reject_rental, name='reject-rental'),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)