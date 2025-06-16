from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
from .models import Notification

def create_notification(user, notification_type, title, message, related_complaint=None):
    """
    Создает уведомление в базе данных
    """
    return Notification.objects.create(
        user=user,
        type=notification_type,
        title=title,
        message=message,
        related_complaint=related_complaint
    )

def send_complaint_received_notification(complaint):
    """
    Отправляет уведомление о получении новой жалобы
    """
    subject = f'Новая жалоба #{complaint.id} получена'
    message = f'Ваша жалоба #{complaint.id} получена и будет рассмотрена в ближайшее время.'
    
    try:
        html_message = render_to_string('email/complaint_received.html', {
            'user': complaint.complainant,
            'complaint': complaint
        })
        plain_message = strip_tags(html_message)
    except:
        plain_message = message
        html_message = None
    
    # Отправляем email
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[complaint.complainant.email],
        html_message=html_message,
        fail_silently=True,
    )

    # Создаем уведомление в базе данных
    create_notification(
        user=complaint.complainant,
        notification_type='complaint_received',
        title=subject,
        message=message,
        related_complaint=complaint
    )

def send_complaint_status_update_notification(complaint):
    """
    Отправляет уведомление об изменении статуса жалобы
    """
    subject = f'Статус жалобы #{complaint.id} обновлен'
    message = f'Статус вашей жалобы #{complaint.id} изменен на "{complaint.get_status_display()}".'
    
    try:
        html_message = render_to_string('email/complaint_status_updated.html', {
            'user': complaint.complainant,
            'complaint': complaint
        })
        plain_message = strip_tags(html_message)
    except:
        plain_message = message
        html_message = None
    
    # Отправляем email
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[complaint.complainant.email],
        html_message=html_message,
        fail_silently=True,
    )

    # Создаем уведомление в базе данных
    create_notification(
        user=complaint.complainant,
        notification_type='complaint_status_updated',
        title=subject,
        message=message,
        related_complaint=complaint
    )

def send_complaint_supported_notification(complaint, supporter):
    """
    Отправляет уведомление о поддержке жалобы
    """
    subject = f'Жалоба #{complaint.id} получила поддержку'
    message = f'Пользователь {supporter.username} поддержал вашу жалобу #{complaint.id}.'
    
    # Создаем уведомление в базе данных
    create_notification(
        user=complaint.complainant,
        notification_type='complaint_supported',
        title=subject,
        message=message,
        related_complaint=complaint
    )

def send_complaint_comment_notification(complaint, comment):
    """
    Отправляет уведомление о новом комментарии к жалобе
    """
    subject = f'Новый комментарий к жалобе #{complaint.id}'
    message = f'Пользователь {comment.user.username} оставил комментарий к вашей жалобе #{complaint.id}.'
    
    # Создаем уведомление в базе данных
    create_notification(
        user=complaint.complainant,
        notification_type='complaint_commented',
        title=subject,
        message=message,
        related_complaint=complaint
    )

def send_rental_confirmation_notification(rental):
    """
    Отправляет уведомление о подтверждении аренды
    """
    subject = f'Аренда подтверждена - {rental.house.address}'
    message = f'Ваша заявка на аренду {rental.house.address} была подтверждена владельцем.'
    
    # Отправляем email
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[rental.tenant.email],
        fail_silently=False,
    )

    # Создаем уведомление в базе данных
    create_notification(
        user=rental.tenant,
        notification_type='rental_confirmed',
        title=subject,
        message=message,
        related_complaint=None
    )

def send_rental_rejection_notification(rental):
    """
    Отправляет уведомление об отклонении аренды
    """
    subject = f'Аренда отклонена - {rental.house.address}'
    message = f'К сожалению, ваша заявка на аренду {rental.house.address} была отклонена владельцем.'
    
    # Отправляем email
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[rental.tenant.email],
        fail_silently=False,
    )

    # Создаем уведомление в базе данных
    create_notification(
        user=rental.tenant,
        notification_type='rental_rejected',
        title=subject,
        message=message,
        related_complaint=None
    ) 