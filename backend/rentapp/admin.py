# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, BlacklistEntry, UserViolation, ComplaintReason

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


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """
    Кастомизированная админка для пользователей с дополнительными полями и действиями.
    """
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'is_staff', 'is_superuser', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    # Добавляем поля для редактирования
    fieldsets = UserAdmin.fieldsets + (
        ('Дополнительная информация', {
            'fields': ('role', 'phone_number', 'identifier', 'type_identify', 'type_chose', 'country', 'document_type', 'passport_expiry', 'email_confirmed')
        }),
    )
    
    # Добавляем поля для создания нового пользователя
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Дополнительная информация', {
            'fields': ('role', 'phone_number', 'identifier', 'type_identify', 'type_chose', 'country', 'document_type', 'passport_expiry', 'email_confirmed')
        }),
    )
    
    # Добавляем действия для управления правами
    actions = ['make_admin', 'remove_admin', 'activate_users', 'deactivate_users']
    
    def make_admin(self, request, queryset):
        """Назначить выбранных пользователей администраторами"""
        count = 0
        for user in queryset:
            if not user.is_superuser:
                user.is_superuser = True
                user.is_staff = True
                user.save()
                count += 1
        
        if count > 0:
            self.message_user(request, f"{count} пользователей назначены администраторами.")
        else:
            self.message_user(request, "Все выбранные пользователи уже являются администраторами.")
    
    make_admin.short_description = "Назначить администраторами"
    
    def remove_admin(self, request, queryset):
        """Снять права администратора у выбранных пользователей"""
        count = 0
        for user in queryset:
            if user.is_superuser and user.id != request.user.id:
                user.is_superuser = False
                user.is_staff = False
                user.save()
                count += 1
        
        if count > 0:
            self.message_user(request, f"Права администратора сняты у {count} пользователей.")
        else:
            self.message_user(request, "Не удалось снять права администратора у выбранных пользователей.")
    
    remove_admin.short_description = "Снять права администратора"
    
    def activate_users(self, request, queryset):
        """Активировать выбранных пользователей"""
        count = queryset.filter(is_active=False).update(is_active=True)
        self.message_user(request, f"{count} пользователей активированы.")
    
    activate_users.short_description = "Активировать пользователей"
    
    def deactivate_users(self, request, queryset):
        """Деактивировать выбранных пользователей"""
        count = queryset.filter(is_active=True).update(is_active=False)
        self.message_user(request, f"{count} пользователей деактивированы.")
    
    deactivate_users.short_description = "Деактивировать пользователей"
