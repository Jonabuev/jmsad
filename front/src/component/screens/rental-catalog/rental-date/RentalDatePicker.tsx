import React from "react";
import styles from "./RentalDatePicker.module.scss";

interface Props {
  startDate: string;
  endDate: string;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;
  onSearch: () => void;
  buttonText: string;
}

export default function RentalDatePicker({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  onSearch,
  buttonText,
}: Props) {
  return (
    <div className={styles.datePicker}>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className={styles.dateInput}
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className={styles.dateInput}
      />
      <button
        onClick={onSearch}
        className={styles.searchButton}
      >
        {buttonText}
      </button>
    </div>
  );
}
