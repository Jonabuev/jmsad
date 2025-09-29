import { FC, useState } from "react";
import { useTranslation } from "next-i18next";
import { IProfileData } from "@/component/type/users.interface";
import { verifyUserDocument } from "@/api/adminApi";
import { useAdminNotifications } from "@/component/hooks/useAdminNotifications";
import AdminNotification from "../AdminNotification";
import styles from "./DocumentVerification.module.scss";

interface DocumentVerificationProps {
  user: IProfileData;
  onVerificationChange: () => void;
}

const DocumentVerification: FC<DocumentVerificationProps> = ({ user, onVerificationChange }) => {
  const { t } = useTranslation("common");
  const { notifications, addNotification, removeNotification } = useAdminNotifications();
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");

  const handleVerification = async (approved: boolean) => {
    try {
      setLoading(true);
      await verifyUserDocument(user.id, approved, comment);
      
      if (approved) {
        addNotification('success', t('admin.verificationApprovedSuccessfully'));
      } else {
        addNotification('success', t('admin.verificationRejectedSuccessfully'));
      }
      
      onVerificationChange();
      setComment("");
    } catch (error: any) {
      console.error("Error verifying document:", error);
      addNotification('error', error.message || t('admin.errorVerifyingDocument'));
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatus = () => {
    if (user.email_confirmed) {
      return {
        status: "verified",
        text: t("admin.verified"),
        className: styles.verificationStatusVerified,
      };
    }
    return {
      status: "pending",
      text: t("admin.pendingVerification"),
      className: styles.verificationStatusPending,
    };
  };

  const verificationStatus = getVerificationStatus();

  return (
    <div className={styles.documentVerificationCard}>
      <div className={styles.verificationHeader}>
        <h3 className={styles.verificationTitle}>{t("admin.documentVerification")}</h3>
        <div className={`${styles.verificationStatus} ${verificationStatus.className}`}>
          <svg className={styles.verificationStatusIcon} fill="currentColor" viewBox="0 0 20 20">
            {verificationStatus.status === "verified" ? (
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.414L11 9.586V6z" clipRule="evenodd" />
            )}
          </svg>
          {verificationStatus.text}
        </div>
      </div>

      {/* User Information */}
      <div className={styles.infoSection}>
        <h4 className={styles.infoSectionTitle}>{t("admin.userInformation")}</h4>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>{t("admin.fullName")}</dt>
            <dd className={styles.infoValue}>{user.username}</dd>
          </div>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>{t("admin.email")}</dt>
            <dd className={styles.infoValue}>{user.email}</dd>
          </div>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>{t("admin.phone")}</dt>
            <dd className={styles.infoValue}>{user.phone_number || t("admin.notProvided")}</dd>
          </div>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>{t("admin.identifier")}</dt>
            <dd className={styles.infoValue}>{user.identifier || t("admin.notProvided")}</dd>
          </div>
        </div>
      </div>

      {/* Document Information */}
      <div className={styles.infoSection}>
        <h4 className={styles.infoSectionTitle}>{t("admin.documentInformation")}</h4>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>{t("admin.documentType")}</dt>
            <dd className={styles.infoValue}>
              {user.document_type === "id_card" ? t("admin.idCard") :
               user.document_type === "passport_kz" ? t("admin.passportKz") :
               user.document_type === "visa" ? t("admin.visa") : t("admin.notProvided")}
            </dd>
          </div>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>{t("admin.passportExpiry")}</dt>
            <dd className={styles.infoValue}>{user.passport_expiry || t("admin.notProvided")}</dd>
          </div>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>{t("admin.citizenship")}</dt>
            <dd className={styles.infoValue}>{user.user?.citizenship || t("admin.notProvided")}</dd>
          </div>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>{t("admin.visaNumber")}</dt>
            <dd className={styles.infoValue}>{user.user?.visa_number || t("admin.notProvided")}</dd>
          </div>
        </div>
      </div>

      {/* Neural Network Analysis */}
      <div className={styles.neuralAnalysisSection}>
        <h4 className={styles.neuralAnalysisTitle}>{t("admin.neuralNetworkAnalysis")}</h4>
        <div className={styles.neuralAnalysisContent}>
          <p className={styles.neuralAnalysisDescription}>{t("admin.neuralNetworkDescription")}</p>
          <div className={styles.neuralAnalysisGrid}>
            <div className={styles.neuralAnalysisItem}>
              <dt className={styles.neuralAnalysisLabel}>{t("admin.extractedName")}</dt>
              <dd className={styles.neuralAnalysisValue}>{user.username}</dd>
            </div>
            <div className={styles.neuralAnalysisItem}>
              <dt className={styles.neuralAnalysisLabel}>{t("admin.extractedIin")}</dt>
              <dd className={styles.neuralAnalysisValue}>{user.identifier || t("admin.notExtracted")}</dd>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Actions */}
      {verificationStatus.status === "pending" && (
        <div className={styles.verificationActions}>
          <div className={styles.commentSection}>
            <label htmlFor="comment" className={styles.commentLabel}>
              {t("admin.verificationComment")}
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder={t("admin.verificationCommentPlaceholder")}
              className={styles.commentTextarea}
            />
          </div>

          <div className={styles.verificationButtons}>
            <button
              onClick={() => handleVerification(true)}
              disabled={loading}
              className={`${styles.verificationButton} ${styles.verificationButtonApprove}`}
            >
              {loading ? (
                <div className={styles.verificationButtonSpinner}></div>
              ) : (
                <svg className={styles.verificationButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {t("admin.approveVerification")}
            </button>

            <button
              onClick={() => handleVerification(false)}
              disabled={loading}
              className={`${styles.verificationButton} ${styles.verificationButtonReject}`}
            >
              {loading ? (
                <div className={styles.verificationButtonSpinner}></div>
              ) : (
                <svg className={styles.verificationButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {t("admin.rejectVerification")}
            </button>
          </div>
        </div>
      )}

      {verificationStatus.status === "verified" && (
        <div className={styles.verificationCompleted}>
          <div className={styles.verificationCompletedContent}>
            <svg className={styles.verificationCompletedIcon} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <p className={styles.verificationCompletedTitle}>{t("admin.verificationCompleted")}</p>
          </div>
          <p className={styles.verificationCompletedMessage}>{t("admin.verificationCompletedMessage")}</p>
        </div>
      )}

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

export default DocumentVerification;
