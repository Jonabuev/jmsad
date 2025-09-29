// components/ViolationForm.tsx

import { useState } from "react";
import { issueViolation } from "@/api/userApi";
import styles from "./ViolationForm.module.scss";

const reasonsList = [
  "Нарушение договора",
  "Оскорбление",
  "Фейковый аккаунт",
  "Жалобы от других арендаторов",
  "Мошенничество",
];

export default function ViolationForm({ targetUserId }: { targetUserId: number }) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmit = async () => {
    if (selectedReasons.length === 0) {
      setMessage("Выберите хотя бы одну причину.");
      return;
    }

    try {
      await issueViolation(targetUserId, selectedReasons.join("; "));
      setMessage("Нарушение успешно назначено");
      setSelectedReasons([]);
    } catch (err) {
      setMessage("Ошибка при назначении нарушения");
    }
  };

  return (
    <div className={styles.violationForm}>
      <h3 className={styles.violationFormTitle}>Назначить нарушение</h3>
      <ul className={styles.violationFormList}>
        {reasonsList.map((reason) => (
          <li key={reason} className={styles.violationFormItem}>
            <label className={styles.violationFormLabel}>
              <input
                type="checkbox"
                className={styles.violationFormCheckbox}
                checked={selectedReasons.includes(reason)}
                onChange={() => toggleReason(reason)}
              />
              {reason}
            </label>
          </li>
        ))}
      </ul>
      <button
        onClick={handleSubmit}
        className={styles.violationFormSubmit}
      >
        Назначить
      </button>
      {message && <p className={styles.violationFormMessage}>{message}</p>}
    </div>
  );
}
