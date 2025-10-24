from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status, generics, filters
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.contrib.auth import get_user_model
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rentapp.models import CustomUser, IdentityVerification
from rentapp.serializers import CustomUserSerializer, RentalComplaintSerializer, FAQSerializer, ComplaintReasonSerializer
from rentapp.permissions1 import IsAdmin
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class AdminUserPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class AdminUserListView(generics.ListAPIView):
    """
    API endpoint для получения списка пользователей для админ-панели.
    Поддерживает фильтрацию по роли, статусу верификации, блокировке и поиск.
    """
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = AdminUserPagination

    def get_queryset(self):
        # ✅ Оптимизация: используем select_related и prefetch_related для избежания N+1 запросов
        queryset = CustomUser.objects.select_related(
            'identityverification'
        ).prefetch_related(
            'filed_rental_complaints',
            'received_rental_complaints',
            'houses',
            'notifications'
        ).annotate(
            complaints_filed_count=Count('filed_rental_complaints', distinct=True),
            complaints_received_count=Count('received_rental_complaints', distinct=True),
            properties_count=Count('houses', distinct=True)
        ).order_by('-date_joined')
        
        # Поиск по имени, email или ИИН
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(identifier__icontains=search)
            )
        
        # Фильтр по роли
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        
        # Фильтр по статусу верификации
        verification_status = self.request.query_params.get('verification_status', None)
        if verification_status == 'verified':
            queryset = queryset.filter(email_confirmed=True)
        elif verification_status == 'pending':
            queryset = queryset.filter(email_confirmed=False)
        
        # Фильтр по статусу блокировки
        is_banned = self.request.query_params.get('is_banned', None)
        if is_banned is not None:
            is_banned_bool = is_banned.lower() == 'true'
            queryset = queryset.filter(is_banned=is_banned_bool)
        
        return queryset


class AdminUserDetailView(generics.RetrieveAPIView):
    """
    API endpoint для получения детальной информации о пользователе для админ-панели.
    """
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    lookup_field = 'id'

    def get_queryset(self):
        return CustomUser.objects.all()


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def ban_user(request, user_id):
    """
    API endpoint для блокировки пользователя.
    """
    try:
        logger.info(f"Banning user {user_id} by admin {request.user.id}")
        user = get_object_or_404(CustomUser, id=user_id)
        reason = request.data.get('reason', 'Banned by administrator')
        
        if user.is_superuser:
            logger.warning(f"Attempted to ban superuser {user_id}")
            return Response(
                {'error': 'Cannot ban superuser'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.is_banned = True
        user.save()
        logger.info(f"User {user_id} banned successfully")
        
        # Создаем запись о нарушении
        from rentapp.models import UserViolation
        UserViolation.objects.create(
            user=user,
            reason=reason,
            issued_by=request.user
        )
        logger.info(f"Violation record created for user {user_id}")
        
        # Логируем активность
        from rentapp.utils import log_activity
        log_activity(
            action_type='user_ban',
            description=f'Пользователь {user.username} ({user.email}) заблокирован. Причина: {reason}',
            user=request.user,
            target_object=user,
            request=request,
            metadata={'reason': reason, 'user_id': user.id}
        )
        
        # Отправляем уведомление пользователю
        from rentapp.notifications import send_user_ban_notification
        send_user_ban_notification(user, reason, banned=True)
        
        # Отправляем уведомление на email
        try:
            send_mail(
                subject='Account Banned - ARNO',
                message=f'Your account has been banned. Reason: {reason}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
            logger.info(f"Ban notification email sent to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send ban notification email: {e}")
        
        return Response({
            'message': 'User banned successfully',
            'user_id': user.id,
            'reason': reason
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error banning user {user_id}: {e}", exc_info=True)
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def unban_user(request, user_id):
    """
    API endpoint для разблокировки пользователя.
    """
    try:
        logger.info(f"Unbanning user {user_id} by admin {request.user.id}")
        user = get_object_or_404(CustomUser, id=user_id)
        
        # Устанавливаем is_banned = False
        user.is_banned = False
        user.save()
        
        # Удаляем запись из blacklist, если она существует
        from rentapp.models import BlacklistEntry
        try:
            blacklist_entry = user.blacklist
            blacklist_entry.delete()
            logger.info(f"Blacklist entry removed for user {user_id}")
        except BlacklistEntry.DoesNotExist:
            logger.info(f"No blacklist entry found for user {user_id}")
        
        logger.info(f"User {user_id} unbanned successfully")
        
        # Логируем активность
        from rentapp.utils import log_activity
        log_activity(
            action_type='user_unban',
            description=f'Пользователь {user.username} ({user.email}) разблокирован',
            user=request.user,
            target_object=user,
            request=request,
            metadata={'user_id': user.id}
        )
        
        # Отправляем уведомление пользователю
        from rentapp.notifications import send_user_ban_notification
        send_user_ban_notification(user, "", banned=False)
        
        # Отправляем уведомление на email
        try:
            send_mail(
                subject='Account Unbanned - ARNO',
                message='Your account has been unbanned. You can now access the platform.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
            logger.info(f"Unban notification email sent to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send unban notification email: {e}")
        
        return Response({
            'message': 'User unbanned successfully',
            'user_id': user.id
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error unbanning user {user_id}: {e}", exc_info=True)
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def make_admin(request, user_id):
    """
    API endpoint для назначения пользователя администратором.
    """
    try:
        user = get_object_or_404(CustomUser, id=user_id)
        
        if user.is_superuser:
            return Response(
                {'error': 'User is already an admin'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.is_superuser = True
        user.is_staff = True
        user.save()
        
        # Логируем активность
        from rentapp.utils import log_activity
        log_activity(
            action_type='user_make_admin',
            description=f'Пользователь {user.username} ({user.email}) назначен администратором',
            user=request.user,
            target_object=user,
            request=request,
            metadata={'user_id': user.id}
        )
        
        # Отправляем уведомление на email
        try:
            send_mail(
                subject='Admin Rights Granted - ARNO',
                message='You have been granted administrator rights on the ARNO platform.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception as e:
            logger.error(f"Failed to send admin notification email: {e}")
        
        return Response({
            'message': 'User granted admin rights successfully',
            'user_id': user.id
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error making user {user_id} admin: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def remove_admin(request, user_id):
    """
    API endpoint для снятия прав администратора у пользователя.
    """
    try:
        user = get_object_or_404(CustomUser, id=user_id)
        
        if not user.is_superuser:
            return Response(
                {'error': 'User is not an admin'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Нельзя снять права у самого себя
        if user.id == request.user.id:
            return Response(
                {'error': 'Cannot remove admin rights from yourself'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.is_superuser = False
        user.is_staff = False
        user.save()
        
        # Логируем активность
        from rentapp.utils import log_activity
        log_activity(
            action_type='user_remove_admin',
            description=f'У пользователя {user.username} ({user.email}) сняты права администратора',
            user=request.user,
            target_object=user,
            request=request,
            metadata={'user_id': user.id}
        )
        
        # Отправляем уведомление на email
        try:
            send_mail(
                subject='Admin Rights Removed - ARNO',
                message='Your administrator rights have been removed from the ARNO platform.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception as e:
            logger.error(f"Failed to send admin removal notification email: {e}")
        
        return Response({
            'message': 'Admin rights removed successfully',
            'user_id': user.id
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error removing admin rights from user {user_id}: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def verify_user_document(request, user_id):
    """
    API endpoint для верификации документов пользователя.
    """
    try:
        user = get_object_or_404(CustomUser, id=user_id)
        approved = request.data.get('approved', False)
        comment = request.data.get('comment', '')
        
        if approved:
            user.email_confirmed = True
            user.save()
            
            # Логируем активность
            from rentapp.utils import log_activity
            log_activity(
                action_type='user_verify',
                description=f'Документы пользователя {user.username} ({user.email}) верифицированы. Комментарий: {comment}',
                user=request.user,
                target_object=user,
                request=request,
                metadata={'user_id': user.id, 'approved': True, 'comment': comment}
            )
            
            # Отправляем уведомление пользователю
            from rentapp.notifications import send_user_verification_notification
            send_user_verification_notification(user, approved=True)
            
            # Отправляем уведомление на email
            try:
                send_mail(
                    subject='Document Verification Approved - ARNO',
                    message=f'Your documents have been verified successfully. {comment}',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception as e:
                logger.error(f"Failed to send verification approval email: {e}")
        else:
            # Логируем активность
            from rentapp.utils import log_activity
            log_activity(
                action_type='user_verify',
                description=f'Верификация документов пользователя {user.username} ({user.email}) отклонена. Причина: {comment}',
                user=request.user,
                target_object=user,
                request=request,
                metadata={'user_id': user.id, 'approved': False, 'comment': comment}
            )
            
            # Отправляем уведомление об отклонении
            try:
                send_mail(
                    subject='Document Verification Rejected - ARNO',
                    message=f'Your document verification has been rejected. Reason: {comment}',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception as e:
                logger.error(f"Failed to send verification rejection email: {e}")
        
        return Response({
            'message': 'Document verification processed successfully',
            'user_id': user.id,
            'approved': approved,
            'comment': comment
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error verifying document for user {user_id}: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_dashboard_stats(request):
    """
    API endpoint для получения статистики дашборда админ-панели.
    """
    try:
        from django.db.models import Count
        from django.utils import timezone
        from datetime import timedelta
        
        # Общее количество пользователей
        total_users = CustomUser.objects.count()
        
        # Количество пользователей за последнюю неделю
        week_ago = timezone.now() - timedelta(days=7)
        recent_users = CustomUser.objects.filter(date_joined__gte=week_ago).count()
        
        # Количество ожидающих верификации
        pending_verifications = CustomUser.objects.filter(email_confirmed=False).count()
        
        # Количество заблокированных пользователей
        banned_users = CustomUser.objects.filter(is_banned=True).count()
        
        # Количество жалоб (если есть модель жалоб)
        try:
            from rentapp.models import RentalComplaint
            total_complaints = RentalComplaint.objects.count()
            recent_complaints = RentalComplaint.objects.filter(created_at__gte=week_ago).count()
        except ImportError:
            total_complaints = 0
            recent_complaints = 0
        
        stats = {
            'total_users': total_users,
            'recent_users': recent_users,
            'pending_verifications': pending_verifications,
            'banned_users': banned_users,
            'total_complaints': total_complaints,
            'recent_complaints': recent_complaints,
            'active_disputes': 0,  # TODO: Implement when disputes are available
        }
        
        return Response(stats, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== COMPLAINT MANAGEMENT ====================

class AdminComplaintListView(generics.ListAPIView):
    """
    API endpoint для получения списка всех жалоб для админ-панели.
    """
    serializer_class = RentalComplaintSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'complainant', 'accused']
    search_fields = ['description', 'complainant__username', 'accused__username']
    ordering_fields = ['created_at', 'updated_at', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        from django.db.models import Q
        from rentapp.models import RentalComplaint
        queryset = RentalComplaint.objects.select_related('complainant', 'accused').prefetch_related('images', 'disputes')
        
        # Фильтрация по ИИН/БИН пользователя (в любой роли)
        user_iin_bin = self.request.query_params.get('user_iin_bin')
        if user_iin_bin:
            queryset = queryset.filter(
                Q(complainant__identifier__icontains=user_iin_bin) |
                Q(accused__identifier__icontains=user_iin_bin)
            )
        
        return queryset


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def complaint_statistics(request):
    """
    API endpoint для получения статистики жалоб.
    """
    try:
        from rentapp.models import RentalComplaint, ComplaintDispute
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Общая статистика
        total_complaints = RentalComplaint.objects.count()
        pending_complaints = RentalComplaint.objects.filter(status='pending').count()
        reviewed_complaints = RentalComplaint.objects.filter(status='reviewed').count()
        rejected_complaints = RentalComplaint.objects.filter(status='rejected').count()
        
        # Статистика по времени
        recent_complaints = RentalComplaint.objects.filter(created_at__gte=week_ago).count()
        monthly_complaints = RentalComplaint.objects.filter(created_at__gte=month_ago).count()
        
        # Статистика оспариваний
        total_disputes = ComplaintDispute.objects.count()
        recent_disputes = ComplaintDispute.objects.filter(created_at__gte=week_ago).count()
        
        # Статистика по типам жалоб
        complaint_types = RentalComplaint.objects.values('reasons__reason').annotate(
            count=Count('id')
        ).order_by('-count')
        
        stats = {
            'total_complaints': total_complaints,
            'pending_complaints': pending_complaints,
            'reviewed_complaints': reviewed_complaints,
            'rejected_complaints': rejected_complaints,
            'recent_complaints': recent_complaints,
            'monthly_complaints': monthly_complaints,
            'total_disputes': total_disputes,
            'recent_disputes': recent_disputes,
            'complaint_types': [
                {
                    'reasons__reason': item['reasons__reason'],
                    'count': item['count']
                }
                for item in complaint_types
            ],
        }
        
        return Response(stats, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting complaint statistics: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def moderate_complaint(request, complaint_uuid):
    """
    API endpoint для модерации жалобы (одобрить/отклонить).
    """
    try:
        from rentapp.models import RentalComplaint
        
        logger.info(f"Moderating complaint {complaint_uuid} by admin {request.user.id}")
        
        complaint = get_object_or_404(RentalComplaint, uuid=complaint_uuid)
        action = request.data.get('action')  # 'approve' or 'reject'
        admin_comment = request.data.get('admin_comment', '')
        
        if action not in ['approve', 'reject']:
            return Response(
                {'error': 'Invalid action. Must be "approve" or "reject"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Обновляем статус жалобы
        if action == 'approve':
            complaint.status = 'reviewed'
            complaint.admin_comment = admin_comment
            complaint.moderated_by = request.user
            complaint.moderated_at = timezone.now()
        else:  # reject
            complaint.status = 'rejected'
            complaint.admin_comment = admin_comment
            complaint.moderated_by = request.user
            complaint.moderated_at = timezone.now()
        
        complaint.save()
        logger.info(f"Complaint {complaint_uuid} {action}d successfully")
        
        # Логируем модерацию жалобы
        from rentapp.utils import log_activity
        log_activity(
            action_type='complaint_moderate',
            description=f'Жалоба {action}d администратором. UUID: {complaint_uuid}. Комментарий: {admin_comment}',
            user=request.user,
            target_object=complaint,
            request=request,
            metadata={
                'complaint_uuid': complaint_uuid,
                'action': action,
                'admin_comment': admin_comment,
                'complainant_id': complaint.complainant.id,
                'accused_id': complaint.accused.id if complaint.accused else None
            }
        )
        
        # Отправляем уведомление на email
        try:
            subject = f'Complaint {action.title()}d - ARNO'
            message = f'Your complaint has been {action}d. Admin comment: {admin_comment}'
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[complaint.complainant.email],
                fail_silently=True,
            )
            logger.info(f"Moderation notification email sent to {complaint.complainant.email}")
        except Exception as e:
            logger.error(f"Failed to send moderation notification email: {e}")
        
        return Response({
            'message': f'Complaint {action}d successfully',
            'complaint_uuid': complaint_uuid,
            'status': complaint.status,
            'admin_comment': admin_comment
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error moderating complaint {complaint_uuid}: {e}", exc_info=True)
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def complaint_history(request, complaint_uuid):
    """
    API endpoint для получения истории изменений жалобы.
    """
    try:
        from rentapp.models import RentalComplaint, ComplaintDispute
        
        complaint = get_object_or_404(RentalComplaint, uuid=complaint_uuid)
        
        # Получаем историю оспариваний
        disputes = ComplaintDispute.objects.filter(complaint=complaint).order_by('-created_at')
        
        # Получаем комментарии
        comments = complaint.comments.all().order_by('-created_at')
        
        history = {
            'complaint': {
                'uuid': complaint.uuid,
                'status': complaint.status,
                'created_at': complaint.created_at,
                'updated_at': complaint.updated_at,
                'moderated_by': complaint.moderated_by.username if complaint.moderated_by else None,
                'moderated_at': complaint.moderated_at,
                'admin_comment': complaint.admin_comment,
            },
            'disputes': [
                {
                    'id': dispute.id,
                    'user': dispute.user.username,
                    'explanation': dispute.explanation,
                    'created_at': dispute.created_at,
                    'has_evidence': bool(dispute.evidence),
                }
                for dispute in disputes
            ],
            'comments': [
                {
                    'id': comment.id,
                    'user': comment.user.username,
                    'text': comment.text,
                    'created_at': comment.created_at,
                }
                for comment in comments
            ]
        }
        
        return Response(history, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting complaint history {complaint_uuid}: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== FAQ MANAGEMENT ====================

class FAQListView(generics.ListCreateAPIView):
    """
    API endpoint для получения списка FAQ и создания новых FAQ для админ-панели.
    """
    serializer_class = FAQSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'user_type', 'is_active']
    search_fields = ['question_ru', 'answer_ru', 'question_kz', 'answer_kz', 'question_en', 'answer_en']
    ordering_fields = ['created_at', 'updated_at', 'order']
    ordering = ['user_type', 'category', 'order', 'question_ru']
    
    def get_queryset(self):
        from rentapp.models import FAQ
        return FAQ.objects.all()
    
    def perform_create(self, serializer):
        faq = serializer.save(created_by=self.request.user)
        
        # Логируем активность
        from rentapp.utils import log_activity
        log_activity(
            action_type='faq_create',
            description=f'Создан новый FAQ: "{faq.question_ru[:50]}..."',
            user=self.request.user,
            target_object=faq,
            request=self.request,
            metadata={'faq_id': faq.id, 'category': faq.category, 'user_type': faq.user_type}
        )


class FAQDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint для получения, обновления и удаления конкретного FAQ.
    """
    serializer_class = FAQSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_queryset(self):
        from rentapp.models import FAQ
        return FAQ.objects.all()
    
    def perform_update(self, serializer):
        faq = serializer.save()
        
        # Логируем активность
        from rentapp.utils import log_activity
        log_activity(
            action_type='faq_update',
            description=f'Обновлен FAQ: "{faq.question_ru[:50]}..."',
            user=self.request.user,
            target_object=faq,
            request=self.request,
            metadata={'faq_id': faq.id, 'category': faq.category, 'user_type': faq.user_type}
        )
    
    def perform_destroy(self, instance):
        # Логируем активность перед удалением
        from rentapp.utils import log_activity
        log_activity(
            action_type='faq_delete',
            description=f'Удален FAQ: "{instance.question_ru[:50]}..."',
            user=self.request.user,
            target_object=instance,
            request=self.request,
            metadata={'faq_id': instance.id, 'category': instance.category, 'user_type': instance.user_type}
        )
        
        instance.delete()


# ==================== COMPLAINT REASONS MANAGEMENT ====================

class ComplaintReasonListView(generics.ListCreateAPIView):
    """
    API endpoint для получения списка причин жалоб и создания новых причин.
    Поддерживает мультиязычность через параметр locale.
    """
    serializer_class = ComplaintReasonSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['type', 'is_default']
    search_fields = ['reason', 'reason_kz', 'reason_en']
    ordering = ['type', 'order', 'reason']
    
    def get_queryset(self):
        from rentapp.models import ComplaintReason
        return ComplaintReason.objects.all()
    
    def get_serializer_context(self):
        """Передаем locale в контекст сериализатора"""
        context = super().get_serializer_context()
        context['locale'] = self.request.GET.get('locale', 'ru')
        return context
    
    def perform_create(self, serializer):
        reason = serializer.save()
        
        # Логируем активность
        from rentapp.utils import log_activity
        log_activity(
            action_type='complaint_reason_create',
            description=f'Создана новая причина жалобы: "{reason.reason[:50]}..."',
            user=self.request.user,
            target_object=reason,
            request=self.request,
            metadata={'reason_id': reason.id, 'type': reason.type, 'is_default': reason.is_default}
        )


class ComplaintReasonDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint для получения, обновления и удаления конкретной причины жалобы.
    Поддерживает мультиязычность через параметр locale.
    """
    serializer_class = ComplaintReasonSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_queryset(self):
        from rentapp.models import ComplaintReason
        return ComplaintReason.objects.all()
    
    def get_serializer_context(self):
        """Передаем locale в контекст сериализатора"""
        context = super().get_serializer_context()
        context['locale'] = self.request.GET.get('locale', 'ru')
        return context
    
    def perform_update(self, serializer):
        reason = serializer.save()
        
        # Логируем активность
        from rentapp.utils import log_activity
        log_activity(
            action_type='complaint_reason_update',
            description=f'Обновлена причина жалобы: "{reason.reason[:50]}..."',
            user=self.request.user,
            target_object=reason,
            request=self.request,
            metadata={'reason_id': reason.id, 'type': reason.type, 'is_default': reason.is_default}
        )
    
    def perform_destroy(self, instance):
        # Логируем активность перед удалением
        from rentapp.utils import log_activity
        log_activity(
            action_type='complaint_reason_delete',
            description=f'Удалена причина жалобы: "{instance.reason[:50]}..."',
            user=self.request.user,
            target_object=instance,
            request=self.request,
            metadata={'reason_id': instance.id, 'type': instance.type, 'is_default': instance.is_default}
        )
        
        instance.delete()


# ==================== ACTIVITY LOGS API ====================

class AdminActivityLogListView(generics.ListAPIView):
    """
    API endpoint для получения списка логов активности для админ-панели.
    Поддерживает фильтрацию по типу действия, пользователю, объекту и дате.
    """
    from rentapp.serializers import ActivityLogSerializer
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = AdminUserPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action_type', 'user', 'target_object_type']
    search_fields = ['action_description', 'user__username', 'user__email']
    ordering_fields = ['created_at', 'action_type']
    ordering = ['-created_at']
    
    def get_queryset(self):
        from rentapp.models import ActivityLog
        queryset = ActivityLog.objects.select_related('user').all()
        
        # Фильтр по дате
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
            
        return queryset


# ==================== PUBLIC FAQ API ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_public_faq(request):
    """
    API для получения FAQ для пользовательской страницы с поддержкой переводов.
    Доступно без авторизации.
    """
    from django.db.models import Q
    from rentapp.models import FAQ
    from rentapp.serializers import PublicFAQSerializer
    
    user_type = request.GET.get('user_type', 'both')  # tenants, landlords, both
    locale = request.GET.get('locale', 'ru')  # ru, kz, en
    
    try:
        faqs = FAQ.objects.filter(is_active=True)
        
        if user_type != 'both':
            faqs = faqs.filter(Q(user_type=user_type) | Q(user_type='both'))
        
        serializer = PublicFAQSerializer(faqs, many=True, context={'locale': locale})
        return Response(serializer.data)
    
    except Exception as e:
        logger.error(f"Error getting public FAQ: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_public_complaint_reasons(request):
    """
    API для получения причин жалоб для пользовательской страницы с поддержкой переводов.
    Доступно без авторизации.
    """
    from rentapp.models import ComplaintReason
    from rentapp.serializers import PublicComplaintReasonSerializer
    
    reason_type = request.GET.get('type', '')  # tenant, landlord
    locale = request.GET.get('locale', 'ru')  # ru, kz, en
    
    try:
        reasons = ComplaintReason.objects.all()
        
        if reason_type:
            reasons = reasons.filter(type=reason_type)
        
        serializer = PublicComplaintReasonSerializer(reasons, many=True, context={'locale': locale})
        return Response(serializer.data)
    
    except Exception as e:
        logger.error(f"Error getting public complaint reasons: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
