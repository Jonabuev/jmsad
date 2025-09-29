import axios from "axios";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

import ComplaintInfo from "./complaint-info/ComplaintInfo";
import ComplaintActionsButtons from "./complaint-action/ComplaintsActions";
import { useAuthProfile } from "@/component/hooks/complaint/useAuthProfile";
import { useComplaint } from "@/component/hooks/complaint/useComplaint";
import { updateComplaintStatus } from "@/api/complaintsApi";
import styles from "./ComplaintPage.module.scss";

export default function ComplaintDetailPage() {
  const router = useRouter();
  const { uuid } = router.query;
  const { t } = useTranslation("common");

  const { profile, setProfile, authLoading } = useAuthProfile();
  const { complaint, loading } = useComplaint(uuid);

  const handleStatusUpdate = async (
    complaintId: number,
    status: "reviewed" | "rejected"
  ) => {
    try {
      await updateComplaintStatus(complaintId, status);

      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          complaint_admin: prev.admin_complaints?.map((c) =>
            c.id === complaintId ? { ...c, status } : c
          ),
        };
      });
    } catch (err) {
      alert("Ошибка при обновлении статуса жалобы");
      console.error(err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}>
            <div className={styles.loadingSpinnerOuter}></div>
            <div className={styles.loadingSpinnerInner}></div>
          </div>
          <p className={styles.loadingText}>{t("loading")}</p>
        </div>
      </div>
    );
  }
  
  if (!complaint) {
    return (
      <div className={styles.notFoundContainer}>
        <div className={styles.notFoundContent}>
          <div className={styles.notFoundEmoji}>😞</div>
          <h2 className={styles.notFoundTitle}>{t("complaint.notFound")}</h2>
          <p className={styles.notFoundDescription}>Жалоба не найдена или была удалена</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.complaintPage}>
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.headerContent}>
            <div className={styles.headerInfo}>
              <h1 className={styles.headerTitle}>
                {t("complaint.title")} №{complaint.id}
              </h1>
              <div className={styles.headerMeta}>
                <span className={`${styles.statusBadge} ${
                  complaint.status === 'pending' ? styles.statusBadgePending :
                  complaint.status === 'reviewed' ? styles.statusBadgeReviewed :
                  styles.statusBadgeRejected
                }`}>
                  <span className={`${styles.statusDot} ${
                    complaint.status === 'pending' ? styles.statusDotPending :
                    complaint.status === 'reviewed' ? styles.statusDotReviewed :
                    styles.statusDotRejected
                  }`}></span>
                  {t(`complaint.${complaint.status}`)}
                </span>
                <span className={styles.createdDate}>
                  Создано: {new Date(complaint.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Complaint Info */}
          <ComplaintInfo complaint={complaint} t={t} />

          {/* Actions */}
          <div className={styles.actionsSection}>
            <div className={styles.actionsContainer}>
              <div className={styles.userActions}>
                {/* Edit Button - Show for complaint owner */}
                {profile?.user.id === complaint.complainant?.id && (
                  <a
                    href={`/complaints/${uuid}/edit`}
                    className={`${styles.actionButton} ${styles.editButton}`}
                  >
                    <svg className={styles.actionButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Редактировать жалобу
                  </a>
                )}

                {/* Dispute Button - Show for accused user when complaint is reviewed */}
                {profile?.user.id === complaint.accused?.id && complaint.status === "reviewed" && (
                  <a
                    href={`/complaints/${uuid}/dispute`}
                    className={`${styles.actionButton} ${styles.disputeButton}`}
                  >
                    <svg className={styles.actionButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Оспорить жалобу
                  </a>
                )}
              </div>

              {/* Admin Actions */}
              {profile?.user.is_superuser && complaint.status === "pending" && (
                <div className={styles.adminActions}>
                  <ComplaintActionsButtons
                    complaint={complaint}
                    t={t}
                    onUpdate={handleStatusUpdate}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
