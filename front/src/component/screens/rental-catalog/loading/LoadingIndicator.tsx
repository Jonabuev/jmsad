import styles from "./LoadingIndicator.module.scss";

export default function LoadingIndicator({ text }: { text: string }) {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner} role="status">
        <span className={styles.spinnerText}>{text}</span>
      </div>
    </div>
  );
}
