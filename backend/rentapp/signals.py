from django.db.models.signals import post_save, post_migrate
from django.dispatch import receiver
from django.apps import apps
from rentapp.models import CustomUser


@receiver(post_migrate)
def create_default_complaint_reasons(sender, **kwargs):
    """
    Автоматически создает дефолтные причины жалоб после миграций
    """
    if sender.name == 'rentapp':
        ComplaintReason = apps.get_model('rentapp', 'ComplaintReason')
        ComplaintReason.ensure_default_reasons_exist()


@receiver(post_save, sender=CustomUser)
def auto_confirm_superuser(sender, instance, **kwargs):
    """
    Автоматически подтверждает email у всех суперпользователей
    """
    if instance.is_superuser and not instance.email_confirmed:
        CustomUser.objects.filter(pk=instance.pk).update(email_confirmed=True)
