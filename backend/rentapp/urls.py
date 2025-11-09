from django.urls import path, include
from .views.read_pdf import CreateUserFromPDFView, PDFCheckView
from rest_framework_simplejwt.views import TokenRefreshView
from .views.auth import (
    register, login_view, CustomTokenObtainPairView, RequestPasswordResetView,
    RequestPasswordChangeView, ConfirmPasswordChangeView, GoogleAuthView
)
from .views.profile import (
    IssueViolationAPIView, RemoveBanAPIView, UserCommentDetailAPIView, UserCommentListCreateAPIView, profile, edit_profile, profile_view, PublicUserProfileView, user_apartments, verify_identity,
    TenantRegistryView, TenantRegistryView1, TenantRegistryView2, user_info, verification_status, regenerate_anonymous_name, get_anonymous_name
)
from .views.rental import (
    MyRentalsAPIView, RentalListCreateView, RentalDetailView, RentalRequestListView,
    CreateRentalRequest, confirm_rental, reject_rental, create_apartment, AvailableHousesView, AllHousesView,
    FavoriteListCreateView
)
from .views.complaint import (
    createRentalComplaint, default_complaint_reasons, dispute_complaintFinal, get_complaint_by_uuid, search_users_by_iin, submit_complaint, dispute_complaint, update_complaint, update_complaint_status,
    update_complaint_status1, complaint_reasons, all_complaint_reasons, ComplaintReasonListTenant,
    ComplaintReasonListLandlord, ComplaintDetailByUUIDView, AddCommentAPIView, SupportComplaintAPIView,
    house_locations, CreateComplaintAPIView)
from .views.forum import ForumView, get_location_filters
from .views.chat import ChatThreadListCreateView, ChatMessageListCreateView
from .views.ml import (
    RecommendTenantsAPIView, ROCImageAPIView, OCRCheckView, evaluate_reliability
)
from .views.manual_verification import ManualVerificationView, PendingVerificationsView
from .views.admin_views import (
    AdminUserListView, AdminUserDetailView, ban_user, unban_user, 
    make_admin, remove_admin, verify_user_document, admin_dashboard_stats,
    AdminComplaintListView, complaint_statistics, moderate_complaint, complaint_history,
    FAQListView, FAQDetailView, ComplaintReasonListView, ComplaintReasonDetailView,
    AdminActivityLogListView, get_public_faq, get_public_complaint_reasons
)
from .views.notification import (
    NotificationListView, NotificationDetailView, NotificationMarkAsReadView,
    NotificationMarkAllAsReadView, NotificationUnreadCountView, NotificationSettingsView,
    NotificationDeleteView, NotificationBulkDeleteView
)
from .views.fcm_views import (
    FCMTokenListCreateView, FCMTokenDetailView, register_fcm_token,
    unregister_fcm_token, test_push_notification, fcm_token_stats
)
from .views.file_access import serve_protected_file, serve_complaint_image
from .views.gdpr import request_data_deletion, export_user_data, gdpr_info

# from django.conf import settings
# from django.conf.urls.static import static

urlpatterns = [
    # Получение токенов
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/edit/', edit_profile, name='edit_profile'),
    path('apartments/create/', create_apartment, name='create_apartment'),
    path('apartments/', user_apartments, name='user_apartments'),
    path('verify-identity/', verify_identity, name='verify_identity'),
    path('verify-identity1/', OCRCheckView.as_view(), name='verify_identity1'),
    path('manual-verification/', ManualVerificationView.as_view(), name='manual_verification'),
    path('pending-verifications/', PendingVerificationsView.as_view(), name='pending_verifications'),
    path('complaints/<int:complaint_id>/update/', update_complaint_status, name='update_complaint_status'),
    path('complaints/submit/', submit_complaint, name='submit_complaint'),
    path('house-locations/', house_locations, name='house-locations'),
    path('complaint-reasons/', complaint_reasons, name='complaint_reasons'),
    path('default-complaint-reasons/', default_complaint_reasons, name='default_complaint_reasons'),
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
    path("api/verification-status/", verification_status),
    path('auth/google/', GoogleAuthView.as_view(), name='google-auth'),
    path('complaints/<uuid:uuid>/', ComplaintDetailByUUIDView.as_view(), name='complaint-detail'),
    path('register/', register, name='register'),
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
    path("comments/", UserCommentListCreateAPIView.as_view(), name="comment-list-create"),
    path("comments/<int:pk>/", UserCommentDetailAPIView.as_view(), name="comment-detail"),
    # Анонимные имена
    path('anonymous-name/regenerate/', regenerate_anonymous_name, name='regenerate-anonymous-name'),
    path('anonymous-name/', get_anonymous_name, name='get-anonymous-name'),
    #нарушения
    path("issue-violation/", IssueViolationAPIView.as_view(), name="issue-violation"),
    path("remove-ban/", RemoveBanAPIView.as_view(), name="remove-ban"),
    #жалобы
    path("rental-complaints/<uuid:uuid>/update/", update_complaint),
    path("rental-complaints/<uuid:uuid>/", get_complaint_by_uuid),
    path("complaints/<uuid:uuid>/dispute/", dispute_complaintFinal, name='dispute-complaint'),
    path('rental-complaints/create/', createRentalComplaint, name='create_rental_complaint'),
    path("users/search/", search_users_by_iin, name="search_users_by_iin"),
    
    # Admin API endpoints
    path('admin/dashboard/stats/', admin_dashboard_stats, name='admin_dashboard_stats'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_users_list'),
    path('admin/users/<int:id>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
    path('admin/users/<int:user_id>/ban/', ban_user, name='admin_ban_user'),
    path('admin/users/<int:user_id>/unban/', unban_user, name='admin_unban_user'),
    path('admin/users/<int:user_id>/make-admin/', make_admin, name='admin_make_admin'),
    path('admin/users/<int:user_id>/remove-admin/', remove_admin, name='admin_remove_admin'),
    path('admin/users/<int:user_id>/verify-document/', verify_user_document, name='admin_verify_document'),
    
    # Admin Complaint API endpoints
    path('admin/complaints/', AdminComplaintListView.as_view(), name='admin_complaints_list'),
    path('admin/complaints/statistics/', complaint_statistics, name='admin_complaints_statistics'),
    path('admin/complaints/<str:complaint_uuid>/moderate/', moderate_complaint, name='admin_moderate_complaint'),
    path('admin/complaints/<str:complaint_uuid>/history/', complaint_history, name='admin_complaint_history'),
    
    # Admin Settings API endpoints
    path('admin/settings/faq/', FAQListView.as_view(), name='admin_faq_list'),
    path('admin/settings/faq/<int:pk>/', FAQDetailView.as_view(), name='admin_faq_detail'),
    path('admin/settings/complaint-reasons/', ComplaintReasonListView.as_view(), name='admin_complaint_reasons_list'),
    path('admin/settings/complaint-reasons/<int:pk>/', ComplaintReasonDetailView.as_view(), name='admin_complaint_reasons_detail'),
    
    # Admin Activity Logs API endpoints
    path('admin/logs/activity/', AdminActivityLogListView.as_view(), name='admin_activity_logs'),
    
    # Public API endpoints
    path('faq/', get_public_faq, name='public_faq'),
    path('complaint-reasons/', get_public_complaint_reasons, name='public_complaint_reasons'),
    
    # Уведомления
    path('notifications/', include([
        path('', NotificationListView.as_view(), name='notification-list'),
        path('unread-count/', NotificationUnreadCountView.as_view(), name='notification-unread-count'),
        path('mark-all-read/', NotificationMarkAllAsReadView.as_view(), name='notification-mark-all-read'),
        path('bulk-delete/', NotificationBulkDeleteView.as_view(), name='notification-bulk-delete'),
        path('settings/', NotificationSettingsView.as_view(), name='notification-settings'),
        path('<int:pk>/', NotificationDetailView.as_view(), name='notification-detail'),
        path('<int:pk>/read/', NotificationMarkAsReadView.as_view(), name='notification-mark-read'),
        path('<int:pk>/delete/', NotificationDeleteView.as_view(), name='notification-delete'),
    ])),
    
    # FCM (Push Notifications) API endpoints
    path('fcm/', include([
        path('tokens/', FCMTokenListCreateView.as_view(), name='fcm-token-list'),
        path('tokens/<int:pk>/', FCMTokenDetailView.as_view(), name='fcm-token-detail'),
        path('register/', register_fcm_token, name='fcm-register-token'),
        path('unregister/<str:token>/', unregister_fcm_token, name='fcm-unregister-token'),
        path('test/', test_push_notification, name='fcm-test-push'),
        path('stats/', fcm_token_stats, name='fcm-token-stats'),
    ])),
    # Read PDF
    path('pdf/', PDFCheckView.as_view(), name='pdf'),
    path('user_pdf/', CreateUserFromPDFView.as_view(), name='pdf'),
    
    # Защищенный доступ к файлам (БЕЗОПАСНОСТЬ)
    path('protected-media/<str:file_type>/<str:user_id>/<str:filename>/', 
         serve_protected_file, 
         name='protected-media'),
    path('protected-media/complaint/<int:complaint_id>/<str:filename>/', 
         serve_complaint_image, 
         name='protected-complaint-image'),
    
    # GDPR Compliance (Защита данных пользователей)
    path('gdpr/delete-data/', request_data_deletion, name='gdpr-delete-data'),
    path('gdpr/export-data/', export_user_data, name='gdpr-export-data'),
    path('gdpr/info/', gdpr_info, name='gdpr-info'),

]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)