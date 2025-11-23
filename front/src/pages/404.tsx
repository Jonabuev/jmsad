import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import Head from 'next/head';
import styles from './404.module.scss';

export default function Custom404() {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>404 - {t('notFound.title', { defaultValue: 'Страница не найдена' })}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.illustration}>
            <div className={styles.number404}>404</div>
            <div className={styles.icon}>
              <svg
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                  className={styles.circle}
                />
                <path
                  d="M100 40 L100 60 M100 140 L100 160 M40 100 L60 100 M140 100 L160 100"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="25"
                  fill="currentColor"
                  className={styles.centerDot}
                />
              </svg>
            </div>
          </div>

          <div className={styles.text}>
            <h1 className={styles.title}>
              {t('notFound.title', { defaultValue: 'Страница не найдена' })}
            </h1>
            <p className={styles.description}>
              {t('notFound.description', {
                defaultValue:
                  'К сожалению, запрашиваемая страница не существует или была перемещена.',
              })}
            </p>
          </div>

          <div className={styles.actions}>
            <Link href="/" className={styles.primaryButton}>
              <svg
                className={styles.buttonIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              {t('notFound.backHome', { defaultValue: 'На главную' })}
            </Link>
            <button
              onClick={() => window.history.back()}
              className={styles.secondaryButton}
            >
              <svg
                className={styles.buttonIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {t('actions.back', { defaultValue: 'Назад' })}
            </button>
          </div>

          <div className={styles.suggestions}>
            <p className={styles.suggestionsTitle}>
              {t('notFound.suggestionsTitle', {
                defaultValue: 'Возможно, вам поможет:',
              })}
            </p>
            <ul className={styles.suggestionsList}>
              <li>
                <Link href="/">
                  {t('notFound.homeLink', { defaultValue: 'Главная' })}
                </Link>
              </li>
              {/* <li>
                <Link href="/rental-catalog">
                  {t('notFound.catalogLink', { defaultValue: 'Каталог аренды' })}
                </Link>
              </li> */}
              <li>
                <Link href="/profile">
                  {t('notFound.profileLink', { defaultValue: 'Профиль' })}
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  {t('notFound.faqLink', { defaultValue: 'FAQ' })}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'ru', ['common'])),
    },
  };
};

