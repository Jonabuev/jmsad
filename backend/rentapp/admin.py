# users/admin.py
from django.contrib import admin
from .models import BlacklistEntry
from .models import UserViolation

@admin.register(BlacklistEntry)
class BlacklistEntryAdmin(admin.ModelAdmin):
    list_display = ("user", "reason", "created_at", "manual_block")




@admin.register(UserViolation)
class UserViolationAdmin(admin.ModelAdmin):
    list_display = ("user", "issued_by", "reason", "created_at", "active")
    list_filter = ("active", "created_at")
    search_fields = ("user__username", "reason")
    actions = ["deactivate_violations"]

    def deactivate_violations(self, request, queryset):
        queryset.update(active=False)
        for violation in queryset:
            violation.user.check_violation_block_status()
        self.message_user(request, "Выбранные нарушения деактивированы.")
