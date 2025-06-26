from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views.auth import (
    register, login_view, CustomTokenObtainPairView, RequestPasswordResetView,
    RequestPasswordChangeView, ConfirmPasswordChangeView, GoogleAuthView
)
from .views.profile import (
    profile, edit_profile, profile_view, PublicUserProfileView, user_apartments, verify_identity,
    TenantRegistryView, TenantRegistryView1, TenantRegistryView2, user_info
)
from .views.rental import (
    MyRentalsAPIView, RentalListCreateView, RentalDetailView, RentalRequestListView,
    CreateRentalRequest, confirm_rental, reject_rental, create_apartment, AvailableHousesView, AllHousesView,
    FavoriteListCreateView
)
from .views.complaint import (
    createRentalComplaint, submit_complaint, dispute_complaint, update_complaint_status,
    update_complaint_status1, complaint_reasons, all_complaint_reasons, ComplaintReasonListTenant,
    ComplaintReasonListLandlord, ComplaintDetailByUUIDView, AddCommentAPIView, SupportComplaintAPIView,
    house_locations, CreateComplaintAPIView
)
from .views.forum import ForumView, get_location_filters
from .views.chat import ChatThreadListCreateView, ChatMessageListCreateView
from .views.notification import NotificationListView, NotificationMarkAsReadView
from .views.ml import (
    RecommendTenantsAPIView, ROCImageAPIView, OCRCheckView, evaluate_reliability
)

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Получение токенов
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/edit/', edit_profile, name='edit_profile'),
    path('apartments/create/', create_apartment, name='create_apartment'),
    path('apartments/', user_apartments, name='user_apartments'),
    path('verify-identity/', verify_identity, name='verify_identity'),
    path('verify-identity1/', OCRCheckView.as_view(), name='verify_identity1'),
    path('complaints/<int:complaint_id>/update/', update_complaint_status, name='update_complaint_status'),
    path('complaints/submit/', submit_complaint, name='submit_complaint'),
    path('house-locations/', house_locations, name='house-locations'),
    path('complaint-reasons/', complaint_reasons, name='complaint_reasons'),
    path('tenant-registry/', TenantRegistryView.as_view(), name='tenant_registry'),
    path('user/profile/<str:username>/', PublicUserProfileView.as_view(), name='public_user_profile'),
    path('tenant-registry1/', TenantRegistryView1.as_view(), name='tenant_registry1'),
    path('complaint/<int:complaint_id>/comment/', AddCommentAPIView.as_view(), name='add_comment'),
    path('support-complaint/', SupportComplaintAPIView.as_view(), name='support_complaint'),
    path('recommend-tenants/', RecommendTenantsAPIView.as_view(), name='recommend_tenants'),
    path('forum/', ForumView.as_view(), name='forum'),
    path('forum/filters/', get_location_filters, name='forum-filters'),
    path('analitics/', RecommendTenantsAPIView.as_view(), name='analitics'),
    path('analiticsML/', evaluate_reliability, name='analiticsML'),
    path('forum-add/<int:complaint_id>/', AddCommentAPIView.as_view(), name='forum_add'),
    path("complaints/<int:pk>/status/", update_complaint_status, name="update_complaint_status"),
    path("complaints1/<int:pk>/status/", update_complaint_status1, name="update_complaint_status1"),
    path('complaints/<int:complaint_id>/dispute/', dispute_complaint),
    path("api/user-info/", user_info),
    path('auth/google/', GoogleAuthView.as_view(), name='google-auth'),
    path('complaints/<uuid:uuid>/', ComplaintDetailByUUIDView.as_view(), name='complaint-detail'),
    path('register/', register, name='register'),
    path('rental-complaints/create/', createRentalComplaint, name='create_rental_complaint'),
    path("my-rentals/", MyRentalsAPIView.as_view(), name="my-rentals"),
    path('rentals/', RentalListCreateView.as_view(), name='rental-list-create'),
    path('rentals/<int:pk>/', RentalDetailView.as_view(), name='rental-detail'),
    path('rental-requests/', RentalRequestListView.as_view(), name='rental-requests'),
    path('rent-house/', CreateRentalRequest.as_view(), name='rental-house'),
    path('roc-curve/', ROCImageAPIView.as_view(), name='roc-image'),
    path('landlords/', TenantRegistryView2.as_view(), name='landlords'),
    path('favorites/', FavoriteListCreateView.as_view(), name='favorite-list-create'),
    path('chat-threads/', ChatThreadListCreateView.as_view(), name='chat-thread-list-create'),
    path('chat-messages/<int:thread_id>/', ChatMessageListCreateView.as_view(), name='chat-message-list-create'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/mark-as-read/', NotificationMarkAsReadView.as_view(), name='notification-mark-as-read'),
    path('available-houses/', AvailableHousesView.as_view(), name='available-houses'),
    path('all-complaint-reasons/', all_complaint_reasons, name='all-complaint-reasons'),
    path('request-password-reset/', RequestPasswordResetView.as_view()),
    path('request-password-change/', RequestPasswordChangeView.as_view()),
    path('confirm-password-change/', ConfirmPasswordChangeView.as_view()),
    path('complaint-reasons/tenant/', ComplaintReasonListTenant.as_view()),
    path('complaint-reasons/landlord/', ComplaintReasonListLandlord.as_view()),
    # Профиль пользователя
    path('profile/', profile, name='profile'),
    path('login/', login_view, name='login'),
    path('all-houses/', AllHousesView.as_view(), name='all-houses'),
    path('rentals/<int:rental_id>/confirm/', confirm_rental, name='confirm-rental'),
    path('rentals/<int:rental_id>/reject/', reject_rental, name='reject-rental'),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)