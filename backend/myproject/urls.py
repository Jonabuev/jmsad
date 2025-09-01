# urls.py
from django.urls import path, include
from rest_framework.urlpatterns import format_suffix_patterns
from django.conf import settings
from django.conf.urls.static import static

from backend.rentapp.views.auth import health_check

urlpatterns = [
    path('api/', include('rentapp.urls')),
    path("health/", health_check),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Add format suffix patterns for flexible formats (e.g., /profile.json)
urlpatterns = format_suffix_patterns(urlpatterns)