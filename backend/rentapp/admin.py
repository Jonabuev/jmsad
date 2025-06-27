# users/admin.py
from django.contrib import admin
from .models import BlacklistEntry

@admin.register(BlacklistEntry)
class BlacklistEntryAdmin(admin.ModelAdmin):
    list_display = ("user", "reason", "created_at", "manual_block")

