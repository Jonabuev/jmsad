import React from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import styles from './SettingsOverview.module.scss';

const SettingsOverview: React.FC = () => {
  const { t } = useTranslation('common');

  const settingsCards = [
    {
      title: t('admin.settings.faq.title'),
      description: t('admin.settings.faq.subtitle'),
      href: '/admin/settings/faq',
      icon: (
        <svg className={`${styles.cardIcon} ${styles.cardIconBlue}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'blue'
    },
    {
      title: t('admin.settings.complaintReasons.title'),
      description: t('admin.settings.complaintReasons.subtitle'),
      href: '/admin/settings/complaint-reasons',
      icon: (
        <svg className={`${styles.cardIcon} ${styles.cardIconGreen}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'green'
    }
  ];

  return (
    <div className={styles.settingsOverview}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          {t('admin.settings.title')}
        </h1>
        <p className={styles.pageDescription}>
          {t('admin.settings.overview')}
        </p>
      </div>

      <div className={styles.settingsGrid}>
        {settingsCards.map((card, index) => (
          <Link
            key={index}
            href={card.href}
            className={`${styles.settingsCard} ${
              card.color === 'blue' ? styles.settingsCardBlue : styles.settingsCardGreen
            }`}
          >
            <div className={styles.cardContent}>
              <div className={`${styles.cardIconContainer} ${
                card.color === 'blue' ? styles.cardIconContainerBlue : styles.cardIconContainerGreen
              }`}>
                {card.icon}
              </div>
              <div className={styles.cardInfo}>
                <h3 className={styles.cardTitle}>
                  {card.title}
                </h3>
                <p className={styles.cardDescription}>
                  {card.description}
                </p>
              </div>
              <div className={styles.cardArrow}>
                <svg className={styles.cardArrow} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Статистика */}
      <div className={styles.statisticsSection}>
        <h2 className={styles.statisticsTitle}>
          {t('admin.settings.statistics')}
        </h2>
        <div className={styles.statisticsGrid}>
          <div className={styles.statisticsCard}>
            <div className={styles.statisticsCardContent}>
              <div className={`${styles.statisticsIconContainer} ${styles.statisticsIconContainerBlue}`}>
                <svg className={`${styles.statisticsIcon} ${styles.statisticsIconBlue}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className={styles.statisticsInfo}>
                <p className={styles.statisticsLabel}>Всего FAQ</p>
                <p className={styles.statisticsValue}>-</p>
              </div>
            </div>
          </div>
          
          <div className={styles.statisticsCard}>
            <div className={styles.statisticsCardContent}>
              <div className={`${styles.statisticsIconContainer} ${styles.statisticsIconContainerGreen}`}>
                <svg className={`${styles.statisticsIcon} ${styles.statisticsIconGreen}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className={styles.statisticsInfo}>
                <p className={styles.statisticsLabel}>Причины жалоб</p>
                <p className={styles.statisticsValue}>-</p>
              </div>
            </div>
          </div>
          
          <div className={styles.statisticsCard}>
            <div className={styles.statisticsCardContent}>
              <div className={`${styles.statisticsIconContainer} ${styles.statisticsIconContainerPurple}`}>
                <svg className={`${styles.statisticsIcon} ${styles.statisticsIconPurple}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className={styles.statisticsInfo}>
                <p className={styles.statisticsLabel}>Последнее обновление</p>
                <p className={`${styles.statisticsValue} ${styles.statisticsValueSmall}`}>-</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsOverview;
