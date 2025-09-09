from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.apps import apps


@receiver(post_migrate)
def create_default_complaint_reasons(sender, **kwargs):
    """
    Автоматически создает дефолтные причины жалоб после миграций
    """
    if sender.name == 'rentapp':
        ComplaintReason = apps.get_model('rentapp', 'ComplaintReason')
        ComplaintReason.ensure_default_reasons_exist()