# """
# GDPR Compliance - Право на удаление и экспорт персональных данных.

# Реализует требования GDPR (General Data Protection Regulation):
# - Article 17: Right to erasure ("right to be forgotten")
# - Article 20: Right to data portability
# """
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from rest_framework import status
# from django.core.mail import send_mail
# from django.conf import settings
# from rentapp.models import CustomUser, IdentityVerification, House, Rental, RentalComplaint, AuditLog
# from rentapp.serializers import HouseSerializer, RentalSerializer, RentalComplaintSerializer
# import logging

# # Логгер для событий безопасности
# security_logger = logging.getLogger('security')


# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def request_data_deletion(request):
#     """
#     Запрос на удаление персональных данных (GDPR Article 17).
    
#     Анонимизирует данные пользователя вместо полного удаления
#     для сохранения целостности системы.
    
#     Что удаляется:
#     - Email, телефон, имя → анонимизируются
#     - Аватар → удаляется
#     - ID документы → удаляются
#     - Identifier (ИИН/БИН) → удаляется
    
#     Что сохраняется (анонимизируется):
#     - История аренды
#     - Жалобы (заменяются на "Deleted User")
#     - ID пользователя (для целостности БД)
    
#     Permissions:
#         - Требуется аутентификация
#     """
#     user = request.user
#     confirmation = request.data.get('confirm', False)
    
#     # Требуем явного подтверждения
#     if not confirmation:
#         return Response({
#             'error': 'Требуется подтверждение',
#             'message': 'Отправьте {"confirm": true} для подтверждения удаления данных'
#         }, status=status.HTTP_400_BAD_REQUEST)
    
#     # Логируем запрос на удаление
#     security_logger.warning(
#         f"GDPR DATA DELETION REQUESTED | User: {user.username} (ID: {user.id}) | "
#         f"Email: {user.email} | IP: {request.META.get('REMOTE_ADDR', 'unknown')}"
#     )
    
#     try:
#         # 1. Анонимизируем персональные данные
#         original_username = user.username
#         original_email = user.email
        
#         user.email = f"deleted_{user.id}@deleted.local"
#         user.username = f"deleted_user_{user.id}"
#         user.phone_number = None
#         user.identifier = None
#         user.documents = {}
#         user.first_name = "Deleted"
#         user.last_name = "User"
#         user.thirdname = None
#         user.is_active = False
#         user.anonymous_name = f"Удаленный пользователь {user.id}"
        
#         # Обнуляем чувствительные поля
#         user.citizenship = None
#         user.passport_expiry = None
#         user.visa_number = None
#         user.document_type = None
#         user.birth_date = None
        
#         user.save()
        
#         # 2. Удаляем аватар
#         if user.avatar and user.avatar.name != 'avatars/def.jpg':
#             try:
#                 user.avatar.delete(save=False)
#             except Exception as e:
#                 security_logger.error(f"Error deleting avatar: {e}")
        
#         # 3. Удаляем ID документы
#         try:
#             verification = IdentityVerification.objects.get(user=user)
#             if verification.id_document:
#                 try:
#                     verification.id_document.delete(save=False)
#                 except Exception as e:
#                     security_logger.error(f"Error deleting ID document: {e}")
#             verification.delete()
#         except IdentityVerification.DoesNotExist:
#             pass
        
#         # 4. Анонимизируем жалобы (не удаляем для сохранения истории)
#         # Жалобы где пользователь истец
#         RentalComplaint.objects.filter(complainant=user).update(
#             complainant=None  # Можно оставить None или создать специального "Deleted User"
#         )
        
#         # Жалобы где пользователь ответчик
#         RentalComplaint.objects.filter(accused=user).update(
#             accused=None
#         )
        
#         # 5. Анонимизируем дома (если арендодатель)
#         House.objects.filter(owner=user).update(
#             # Можно перенести на системного пользователя или оставить как есть
#             # owner=user  # Оставляем связь, но пользователь анонимизирован
#         )
        
#         # 6. Анонимизируем аренды
#         Rental.objects.filter(tenant=user).update(
#             # tenant=user  # Оставляем связь, но пользователь анонимизирован
#         )
        
#         # Логируем успешное удаление
#         security_logger.info(
#             f"GDPR DATA DELETION COMPLETED | "
#             f"Original User: {original_username} (ID: {user.id}) | "
#             f"Email: {original_email}"
#         )
        
#         # ✅ Audit Trail: Логируем удаление данных
#         AuditLog.log_action(
#             action='delete_data',
#             request=request,
#             target_user=user,
#             details={
#                 'original_username': original_username,
#                 'original_email': original_email
#             }
#         )
        
#         # Отправляем email подтверждение (на старый email, пока пользователь не вышел)
#         try:
#             send_mail(
#                 subject='Ваши данные были удалены',
#                 message=f'''
# Здравствуйте,

# Ваши персональные данные были успешно удалены из системы JMSAD в соответствии с GDPR.

# Что было удалено:
# - Личные данные (имя, email, телефон)
# - Аватар
# - Документы удостоверяющие личность
# - ИИН/БИН

# Что было анонимизировано:
# - История аренды
# - Жалобы

# Ваш аккаунт деактивирован и не может быть использован для входа.

# Если это было сделано по ошибке, пожалуйста, свяжитесь с нами.

# С уважением,
# Команда JMSAD
#                 ''',
#                 from_email=settings.DEFAULT_FROM_EMAIL,
#                 recipient_list=[original_email],
#                 fail_silently=True,
#             )
#         except Exception as e:
#             security_logger.error(f"Error sending deletion confirmation email: {e}")
        
#         return Response({
#             'success': True,
#             'message': 'Ваши персональные данные были успешно удалены',
#             'details': {
#                 'deleted': [
#                     'Email',
#                     'Телефон',
#                     'Имя',
#                     'Аватар',
#                     'ID документы',
#                     'ИИН/БИН'
#                 ],
#                 'anonymized': [
#                     'История аренды',
#                     'Жалобы',
#                     'Дома (если арендодатель)'
#                 ]
#             }
#         }, status=status.HTTP_200_OK)
        
#     except Exception as e:
#         security_logger.error(
#             f"GDPR DATA DELETION FAILED | User: {user.username} (ID: {user.id}) | Error: {str(e)}"
#         )
#         return Response({
#             'error': 'Ошибка при удалении данных',
#             'message': str(e)
#         }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def export_user_data(request):
#     """
#     Экспорт данных пользователя (GDPR Article 20 - Right to data portability).
    
#     Возвращает все персональные данные пользователя в машиночитаемом формате (JSON).
    
#     Включает:
#     - Личные данные
#     - Дома (если арендодатель)
#     - История аренды
#     - Жалобы (отправленные и полученные)
    
#     Permissions:
#         - Требуется аутентификация
#     """
#     user = request.user
    
#     # Логируем экспорт данных
#     security_logger.info(
#         f"GDPR DATA EXPORT | User: {user.username} (ID: {user.id}) | "
#         f"IP: {request.META.get('REMOTE_ADDR', 'unknown')}"
#     )
    
#     # ✅ Audit Trail: Логируем экспорт данных
#     AuditLog.log_action(
#         action='export_data',
#         request=request,
#         target_user=user,
#         details={'export_size': 'full'}
#     )
    
#     try:
#         # 1. Личные данные
#         personal_data = {
#             'id': user.id,
#             'username': user.username,
#             'email': user.email,
#             'first_name': user.first_name,
#             'last_name': user.last_name,
#             'thirdname': user.thirdname,
#             'phone_number': user.phone_number,
#             'role': user.role,
#             'type_entity': user.type_entity,
#             'type_identify': user.type_identify,
#             'identifier': user.identifier,
#             'email_confirmed': user.email_confirmed,
#             'phone_confirmed': user.phone_confirmed,
#             'citizenship': user.citizenship,
#             'passport_expiry': str(user.passport_expiry) if user.passport_expiry else None,
#             'visa_number': user.visa_number,
#             'document_type': user.document_type,
#             'birth_date': str(user.birth_date) if user.birth_date else None,
#             'date_joined': str(user.date_joined),
#             'last_login': str(user.last_login) if user.last_login else None,
#             'is_active': user.is_active,
#             'is_banned': user.is_banned,
#             'anonymous_name': user.anonymous_name,
#         }
        
#         # 2. Дома (если арендодатель)
#         houses = []
#         if user.role == 'landlord':
#             user_houses = House.objects.filter(owner=user)
#             houses = HouseSerializer(user_houses, many=True).data
        
#         # 3. История аренды (если арендатор)
#         rentals = []
#         if user.role == 'tenant':
#             user_rentals = Rental.objects.filter(tenant=user)
#             rentals = RentalSerializer(user_rentals, many=True).data
        
#         # 4. Жалобы отправленные
#         complaints_sent = RentalComplaint.objects.filter(complainant=user)
#         complaints_sent_data = RentalComplaintSerializer(complaints_sent, many=True).data
        
#         # 5. Жалобы полученные
#         complaints_received = RentalComplaint.objects.filter(accused=user)
#         complaints_received_data = RentalComplaintSerializer(complaints_received, many=True).data
        
#         # Формируем полный экспорт
#         export_data = {
#             'export_date': str(request.timestamp) if hasattr(request, 'timestamp') else None,
#             'personal_data': personal_data,
#             'houses': houses,
#             'rentals': rentals,
#             'complaints': {
#                 'sent': complaints_sent_data,
#                 'received': complaints_received_data
#             },
#             'gdpr_notice': {
#                 'message': 'Это экспорт ваших персональных данных в соответствии с GDPR Article 20',
#                 'rights': [
#                     'Вы имеете право на удаление этих данных (Article 17)',
#                     'Вы имеете право на исправление неверных данных (Article 16)',
#                     'Вы имеете право на ограничение обработки (Article 18)',
#                 ],
#                 'contact': 'arno.help.service@gmail.com'
#             }
#         }
        
#         return Response(export_data, status=status.HTTP_200_OK)
        
#     except Exception as e:
#         security_logger.error(
#             f"GDPR DATA EXPORT FAILED | User: {user.username} (ID: {user.id}) | Error: {str(e)}"
#         )
#         return Response({
#             'error': 'Ошибка при экспорте данных',
#             'message': str(e)
#         }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def gdpr_info(request):
#     """
#     Информация о правах пользователя по GDPR.
    
#     Возвращает описание доступных прав и действий.
#     """
#     return Response({
#         'gdpr_rights': {
#             'right_to_access': {
#                 'article': 'GDPR Article 15',
#                 'description': 'Право на доступ к своим персональным данным',
#                 'action': 'GET /api/gdpr/export-data/',
#                 'available': True
#             },
#             'right_to_rectification': {
#                 'article': 'GDPR Article 16',
#                 'description': 'Право на исправление неверных данных',
#                 'action': 'PATCH /api/profile/edit/',
#                 'available': True
#             },
#             'right_to_erasure': {
#                 'article': 'GDPR Article 17',
#                 'description': 'Право на удаление ("право быть забытым")',
#                 'action': 'POST /api/gdpr/delete-data/ (с {"confirm": true})',
#                 'available': True
#             },
#             'right_to_data_portability': {
#                 'article': 'GDPR Article 20',
#                 'description': 'Право на перенос данных в машиночитаемом формате',
#                 'action': 'GET /api/gdpr/export-data/',
#                 'available': True
#             },
#             'right_to_restrict_processing': {
#                 'article': 'GDPR Article 18',
#                 'description': 'Право на ограничение обработки',
#                 'action': 'Свяжитесь с нами: arno.help.service@gmail.com',
#                 'available': False
#             },
#             'right_to_object': {
#                 'article': 'GDPR Article 21',
#                 'description': 'Право на возражение против обработки',
#                 'action': 'Свяжитесь с нами: arno.help.service@gmail.com',
#                 'available': False
#             }
#         },
#         'user_data_summary': {
#             'username': request.user.username,
#             'email': request.user.email,
#             'data_collected': [
#                 'Личные данные (имя, email, телефон)',
#                 'История аренды',
#                 'Жалобы',
#                 'Документы удостоверяющие личность',
#                 'Логи доступа'
#             ],
#             'data_retention': 'Данные хранятся пока аккаунт активен',
#             'data_sharing': 'Данные не передаются третьим лицам'
#         },
#         'contact': {
#             'email': 'arno.help.service@gmail.com',
#             'message': 'Для вопросов по GDPR свяжитесь с нами'
#         }
#     })

