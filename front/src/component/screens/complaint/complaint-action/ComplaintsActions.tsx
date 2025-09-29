import { IComplaint } from "@/component/type/users.interface";
import styles from "./ComplaintsActions.module.scss";

interface IComplaintInfoProps {
  complaint: IComplaint;
  t: (key: string) => string;
  onUpdate: (id: number, status: "reviewed" | "rejected") => void;
}

const ComplaintActionsButtons = ({
  complaint,
  t,
  onUpdate,
}: IComplaintInfoProps) => {
  return (
    <div className={styles.complaintActions}>
      <div className={styles.actionsInfo}>
        <h3 className={styles.actionsTitle}>Действия администратора</h3>
        <p className={styles.actionsDescription}>Выберите действие для данной жалобы</p>
      </div>
      
      <div className={styles.actionsButtons}>
        <button
          onClick={() => onUpdate(complaint.id, "reviewed")}
          className={`${styles.actionButton} ${styles.approveButton}`}
        >
          <svg className={styles.actionButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t("complaint.approve")}
        </button>
        
        <button
          onClick={() => onUpdate(complaint.id, "rejected")}
          className={`${styles.actionButton} ${styles.rejectButton}`}
        >
          <svg className={styles.actionButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {t("complaint.reject")}
        </button>
      </div>
    </div>
  );
};

export default ComplaintActionsButtons;
