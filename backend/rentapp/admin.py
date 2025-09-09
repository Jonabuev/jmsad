# users/admin.py
from django.contrib import admin
from .models import BlacklistEntry, UserViolation, ComplaintReason

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


@admin.register(ComplaintReason)
class ComplaintReasonAdmin(admin.ModelAdmin):
    list_display = ("reason", "type", "is_default", "order")
    list_filter = ("type", "is_default")
    search_fields = ("reason",)
    ordering = ("type", "order", "reason")
    actions = ["mark_as_default", "unmark_as_default", "recreate_defaults"]
    
    def mark_as_default(self, request, queryset):
        queryset.update(is_default=True)
        self.message_user(request, "Выбранные причины отмечены как дефолтные.")
    mark_as_default.short_description = "Отметить как дефолтные"
    
    def unmark_as_default(self, request, queryset):
        queryset.update(is_default=False)
        self.message_user(request, "Выбранные причины сняты с дефолтных.")
    unmark_as_default.short_description = "Снять с дефолтных"
    
    def recreate_defaults(self, request, queryset):
        ComplaintReason.ensure_default_reasons_exist()
        self.message_user(request, "Дефолтные причины пересозданы.")
    recreate_defaults.short_description = "Пересоздать дефолтные причины"
