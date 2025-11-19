import { FC, useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import DocumentVerification from "./DocumentVerification";
import { getAdminUserById, banUser, unbanUser, makeAdmin, removeAdmin } from "@/api/adminApi";
import { IProfileData } from "@/component/type/users.interface";
import { useAdminNotifications } from "@/component/hooks/useAdminNotifications";
import AdminNotification from "../AdminNotification";
import styles from "./UserDetail.module.scss";

interface UserDetailProps {
  userId: number;
}

const UserDetail: FC<UserDetailProps> = ({ userId }) => {
  const { t } = useTranslation("common");
  const { notifications, addNotification, removeNotification } = useAdminNotifications();
  const [user, setUser] = useState<IProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdminUserById(userId);
      console.log("User data from API:", response.data); // Debug log
      setUser(response.data);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      setError(error.message || t("admin.errorFetchingUser"));
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: string) => {
    if (!user) return;

    // Дополнительные проверки для критических действий
    if (action === "remove_admin") {
      const confirmed = window.confirm(
        t('admin.confirmRemoveAdmin', { username: user.username })
      );
      if (!confirmed) return;
    }

    try {
      setActionLoading(action);
      
      // Оптимистичное обновление UI
      const updatedUser = { ...user };
      
      switch (action) {
        case "ban":
          updatedUser.is_banned = true;
          setUser(updatedUser);
          addNotification('success', t('admin.userBannedSuccessfully'));
          await banUser(userId, "Banned by administrator");
          break;
        case "unban":
          updatedUser.is_banned = false;
          setUser(updatedUser);
          addNotification('success', t('admin.userUnbannedSuccessfully'));
          await unbanUser(userId);
          break;
        case "make_admin":
          updatedUser.is_superuser = true;
          updatedUser.is_staff = true;
          setUser(updatedUser);
          addNotification('success', t('admin.adminRightsGranted'));
          await makeAdmin(userId);
          break;
        case "remove_admin":
          updatedUser.is_superuser = false;
          updatedUser.is_staff = false;
          setUser(updatedUser);
          addNotification('success', t('admin.adminRightsRemoved'));
          await removeAdmin(userId);
          break;
      }
      
      // Обновляем данные пользователя с сервера
      await fetchUser();
    } catch (error: any) {
      console.error(`Error ${action} user:`, error);
      addNotification('error', error.message || t("admin.errorPerformingAction"));
      // Восстанавливаем данные с сервера в случае ошибки
      await fetchUser();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className={styles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.notFoundContainer}>
        <h3 className={styles.notFoundTitle}>{t("admin.userNotFound")}</h3>
        <p className={styles.notFoundMessage}>{t("admin.userNotFoundMessage")}</p>
      </div>
    );
  }

  const getRoleBadge = (isSuperuser: boolean) => {
    if (isSuperuser) {
      return (
        <span className={`${styles.badge} ${styles.roleBadgeAdmin}`}>
          {t("admin.administrator")}
        </span>
      );
    }
    return (
      <span className={`${styles.badge} ${styles.roleBadgeDefault}`}>
        {t("admin.user")}
      </span>
    );
  };

  const getStatusBadge = (isBanned: boolean) => {
    if (isBanned) {
      return (
        <span className={`${styles.badge} ${styles.statusBadgeBanned}`}>
          <svg className={styles.badgeIcon} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
          </svg>
          {t("admin.banned")}
        </span>
      );
    }
    return (
      <span className={`${styles.badge} ${styles.statusBadgeActive}`}>
        <svg className={styles.badgeIcon} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        {t("admin.active")}
      </span>
    );
  };

  return (
    <div className={styles.userDetail}>
      {/* Header */}
      <div className={styles.headerCard}>
        <div className={styles.headerContent}>
          <div className={styles.backLinkContainer}>
            <Link
              href="/admin/users"
              className={styles.backLink}
            >
              <svg className={styles.backLinkIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t("admin.backToUsers")}
            </Link>
          </div>
          <div className={styles.badgesContainer}>
            {getStatusBadge(user.is_banned)}
            {getRoleBadge(Boolean(user.is_superuser))}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className={styles.userInfoCard}>
        <div className={styles.userInfoContent}>
          <div className={styles.userAvatar}>
            {user.avatar ? (
              <img
                className={styles.userAvatarImage}
                src={user.avatar}
                alt={user.username}
              />
            ) : (
              <div className={styles.userAvatarPlaceholder}>
                <svg className={styles.userAvatarIcon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className={styles.userDetails}>
            <h1 className={styles.userName}>{user.username}</h1>
            <p className={styles.userEmail}>{user.email}</p>
            <div className={styles.userInfoGrid}>
              <div className={styles.userInfoItem}>
                <dt className={styles.userInfoLabel}>{t("admin.userId")}</dt>
                <dd className={styles.userInfoValue}>{user.id}</dd>
              </div>
              <div className={styles.userInfoItem}>
                <dt className={styles.userInfoLabel}>{t("admin.registered")}</dt>
                <dd className={styles.userInfoValue}>{new Date(user.r_date).toLocaleDateString()}</dd>
              </div>
              <div className={styles.userInfoItem}>
                <dt className={styles.userInfoLabel}>{t("admin.phone")}</dt>
                <dd className={styles.userInfoValue}>{user.phone_number || t("admin.notProvided")}</dd>
              </div>
              <div className={styles.userInfoItem}>
                <dt className={styles.userInfoLabel}>{t("admin.emailConfirmed")}</dt>
                <dd className={styles.userInfoValue}>
                  {user.email_confirmed ? (
                    <span className={styles.userInfoValueGreen}>{t("admin.yes")}</span>
                  ) : (
                    <span className={styles.userInfoValueRed}>{t("admin.no")}</span>
                  )}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actionsCard}>
        <h3 className={styles.actionsTitle}>{t("admin.actions")}</h3>
        <div className={styles.actionsContainer}>
          {user.is_banned ? (
            <button
              onClick={() => handleUserAction("unban")}
              disabled={actionLoading === "unban"}
              className={`${styles.actionButton} ${styles.actionButtonUnban}`}
            >
              {actionLoading === "unban" ? (
                <div className={styles.actionButtonSpinner}></div>
              ) : (
                <svg className={styles.actionButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {t("admin.unbanUser")}
            </button>
          ) : (
            <button
              onClick={() => handleUserAction("ban")}
              disabled={actionLoading === "ban"}
              className={`${styles.actionButton} ${styles.actionButtonBan}`}
            >
              {actionLoading === "ban" ? (
                <div className={styles.actionButtonSpinner}></div>
              ) : (
                <svg className={styles.actionButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              )}
              {t("admin.banUser")}
            </button>
          )}

          {/* Debug info */}
          {user.is_superuser ? (
            <button
              onClick={() => handleUserAction("remove_admin")}
              disabled={actionLoading === "remove_admin"}
              className={`${styles.actionButton} ${styles.actionButtonRemoveAdmin}`}
            >
              {actionLoading === "remove_admin" ? (
                <div className={styles.actionButtonSpinner}></div>
              ) : (
                <svg className={styles.actionButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
              {t("admin.removeAdmin")}
            </button>
          ) : (
            <button
              onClick={() => handleUserAction("make_admin")}
              disabled={actionLoading === "make_admin"}
              className={`${styles.actionButton} ${styles.actionButtonMakeAdmin}`}
            >
              {actionLoading === "make_admin" ? (
                <div className={styles.actionButtonSpinner}></div>
              ) : (
                <svg className={styles.actionButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              )}
              {t("admin.makeAdmin")}
            </button>
          )}
        </div>
      </div>

      {/* Document Verification */}
      <DocumentVerification user={user} onVerificationChange={fetchUser} />

      {/* Notifications */}
      {notifications.map((notification) => (
        <AdminNotification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default UserDetail;
