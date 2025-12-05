/**
 * Виртуализированная таблица для больших списков
 * 
 * Использует react-window для оптимизации рендеринга длинных списков
 */

import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import styles from './SearchPage.module.scss';

interface TableRow {
  username: string;
  identifier: string;
  complaint_count: number;
  complaint_dates: string[];
  court_scores: string;
  complaint_reasons: any[];
}

interface VirtualizedTableProps {
  users: TableRow[];
  getTranslatedReasons: (reasons: any[]) => string;
  t: (key: string) => string;
}

const ROW_HEIGHT = 80; // Высота одной строки в пикселях

export const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  users,
  getTranslatedReasons,
  t,
}) => {
  // Мемоизируем заголовки таблицы
  const tableHeaders = useMemo(() => [
    t("search.tenant"),
    t("profile.search.iin"),
    t("profile.search.complaintCount"),
    t("profile.search.complaintDates"),
    t("profile.search.courtDecisionNumber"),
    t("profile.search.complaintReasonsColumn"),
    t("profile.search.profile"),
  ], [t]);

  // Компонент строки таблицы
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const user = users[index];
    
    return (
      <div style={style}>
        <div className={styles.tableRow} style={{ display: 'table-row', width: '100%' }}>
          <div className={styles.tableCell} style={{ display: 'table-cell', width: '15%' }}>
            <div className={styles.tableCellFlex}>
              <div className={styles.userName}>{user.username}</div>
            </div>
          </div>
          <div className={`${styles.tableCell} ${styles.identifier}`} style={{ display: 'table-cell', width: '12%' }}>
            {user.identifier}
          </div>
          <div className={styles.tableCell} style={{ display: 'table-cell', width: '10%' }}>
            {user.complaint_count ?? 0}
          </div>
          <div className={styles.tableCell} style={{ display: 'table-cell', width: '15%' }}>
            {user.complaint_dates && user.complaint_dates.length > 0
              ? user.complaint_dates
                  .map((date) => new Date(date).toLocaleDateString("ru-RU"))
                  .join(", ")
              : "-"}
          </div>
          <div className={styles.tableCell} style={{ display: 'table-cell', width: '15%' }}>
            {user.court_scores || "-"}
          </div>
          <div className={`${styles.tableCell} ${styles.complaintReasons}`} style={{ display: 'table-cell', width: '18%' }}>
            <div className={styles.truncatedText}>
              {getTranslatedReasons(user.complaint_reasons)}
            </div>
          </div>
          <div className={styles.tableCell} style={{ display: 'table-cell', width: '15%' }}>
            <a
              href={`/user/${user.username}`}
              className={styles.profileLink}
            >
              {t("profile.search.viewProfile")}
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.resultsContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              {tableHeaders.map((header, idx) => (
                <th key={idx} className={styles.tableHeader}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        {/* Виртуализированный список строк */}
        <div style={{ height: Math.min(users.length * ROW_HEIGHT, 600), maxHeight: '600px' }}>
          <List
            height={Math.min(users.length * ROW_HEIGHT, 600)}
            itemCount={users.length}
            itemSize={ROW_HEIGHT}
            width="100%"
          >
            {Row}
          </List>
        </div>
      </div>
    </div>
  );
};

