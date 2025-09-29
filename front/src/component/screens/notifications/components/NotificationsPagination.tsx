import React from 'react';
import { useTranslation } from 'next-i18next';
import styles from './NotificationsPagination.module.scss';

interface NotificationsPaginationProps {
  hasNext: boolean;
  hasPrevious: boolean;
  currentPage: number;
  onPageChange: (page: number, reset: boolean) => void;
}

const NotificationsPagination: React.FC<NotificationsPaginationProps> = ({
  hasNext,
  hasPrevious,
  currentPage,
  onPageChange,
}) => {
  const { t } = useTranslation('common');

  return (
    <div className={styles.paginationContainer}>
      <div className={styles.paginationContent}>
        <button
          onClick={() => onPageChange(currentPage - 1, true)}
          disabled={!hasPrevious}
          className={styles.paginationButton}
        >
          {t('common.previous', 'Назад')}
        </button>
        
        <span className={styles.pageInfo}>
          {t('common.page', 'Страница')} {currentPage}
        </span>
        
        <button
          onClick={() => onPageChange(currentPage + 1, true)}
          disabled={!hasNext}
          className={styles.paginationButton}
        >
          {t('common.next', 'Далее')}
        </button>
      </div>
    </div>
  );
};

export default NotificationsPagination;
