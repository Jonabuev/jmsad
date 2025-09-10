# urls.py 
from django.urls import path, include, re_path 
from rest_framework.urlpatterns import format_suffix_patterns
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from .views import health_check 
urlpatterns = [
    path('api/', include('rentapp.urls')),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    path("health/", health_check),
    path("accounts", include("allauth.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# Add format suffix patterns for flexible formats (e.g., /profile.json)
urlpatterns = format_suffix_patterns(urlpatterns)