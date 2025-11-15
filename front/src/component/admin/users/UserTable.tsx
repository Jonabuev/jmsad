import { FC } from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { IProfileData } from "@/component/type/users.interface";
import styles from "./UserTable.module.scss";

interface UserTableProps {
  users: IProfileData[];
  loading: boolean;
  onUserAction: (userId: number, action: string) => void;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  actionLoading?: { [key: string]: boolean };
}

const UserTable: FC<UserTableProps> = ({
  users,
  loading,
  onUserAction,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  actionLoading = {},
}) => {
  const { t } = useTranslation("common");

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

  const getVerificationBadge = (isVerified: boolean) => {
    if (isVerified) {
      return (
        <span className={`${styles.badge} ${styles.verificationBadgeVerified}`}>
          <svg className={styles.badgeIcon} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {t("admin.verified")}
        </span>
      );
    }
    return (
      <span className={`${styles.badge} ${styles.verificationBadgePending}`}>
        <svg className={styles.badgeIcon} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        {t("admin.pending")}
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading && users.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}></div>
          <span className={styles.loadingText}>{t("loading")}</span>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyContent}>
          <svg className={styles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className={styles.emptyTitle}>{t("admin.noUsersFound")}</h3>
          <p className={styles.emptyDescription}>{t("admin.noUsersFoundMessage")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.tableHeader}>
                {t("admin.user")}
              </th>
              <th className={styles.tableHeader}>
                {t("admin.role")}
              </th>
              <th className={styles.tableHeader}>
                {t("admin.verification")}
              </th>
              <th className={styles.tableHeader}>
                {t("admin.status")}
              </th>
              <th className={styles.tableHeader}>
                {t("admin.registered")}
              </th>
              <th className={styles.tableHeader}>
                {t("admin.actions")}
              </th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {users.map((user) => (
              <tr key={user.id} className={styles.tableRow}>
                <td className={styles.tableCell}>
                  <div className={styles.userCell}>
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
                    <div className={styles.userInfo}>
                      <div className={styles.userName}>{user.username}</div>
                      <div className={styles.userEmail}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className={styles.tableCell}>
                  {getRoleBadge(user.is_superuser || false)}
                </td>
                <td className={styles.tableCell}>
                  {getVerificationBadge(user.email_confirmed)}
                </td>
                <td className={styles.tableCell}>
                  {getStatusBadge(user.is_banned)}
                </td>
                <td className={styles.tableCell}>
                  <span className={styles.registeredDate}>
                    {formatDate(user.r_date)}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <div className={styles.actionsContainer}>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className={styles.viewLink}
                    >
                      {t("admin.view")}
                    </Link>
                    {user.is_banned ? (
                      <button
                        onClick={() => onUserAction(user.id, "unban")}
                        disabled={actionLoading[`unban_${user.id}`]}
                        className={`${styles.actionButton} ${styles.actionButtonUnban}`}
                      >
                        {actionLoading[`unban_${user.id}`] && (
                          <div className={`${styles.actionButtonSpinner} ${styles.actionButtonSpinnerGreen}`}></div>
                        )}
                        {t("admin.unban")}
                      </button>
                    ) : (
                      <button
                        onClick={() => onUserAction(user.id, "ban")}
                        disabled={actionLoading[`ban_${user.id}`]}
                        className={`${styles.actionButton} ${styles.actionButtonBan}`}
                      >
                        {actionLoading[`ban_${user.id}`] && (
                          <div className={`${styles.actionButtonSpinner} ${styles.actionButtonSpinnerRed}`}></div>
                        )}
                        {t("admin.ban")}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <div className={styles.paginationMobile}>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={styles.paginationButtonMobile}
            >
              {t("admin.previous")}
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={styles.paginationButtonMobile}
            >
              {t("admin.next")}
            </button>
          </div>
          <div className={styles.paginationDesktop}>
            <div>
              <p className={styles.paginationInfo}>
                {t("admin.showing")} <span className={styles.paginationInfoBold}>{(currentPage - 1) * pageSize + 1}</span> {t("admin.to")} <span className={styles.paginationInfoBold}>{Math.min(currentPage * pageSize, totalCount)}</span> {t("admin.of")} <span className={styles.paginationInfoBold}>{totalCount}</span> {t("admin.results")}
              </p>
            </div>
            <div>
              <nav className={styles.paginationNav}>
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={styles.paginationButton}
                >
                  <svg className={styles.paginationButtonIcon} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`${styles.paginationPageButton} ${page === currentPage ? styles.paginationPageButtonActive : ''}`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={styles.paginationButton}
                >
                  <svg className={styles.paginationButtonIcon} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;