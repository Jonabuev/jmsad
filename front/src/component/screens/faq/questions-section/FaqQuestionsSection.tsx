import { FC, useState } from "react";
import { useTranslation } from "next-i18next";
import { useFAQ } from "@/hooks/useFAQ";
import styles from "./FaqQuestionsSection.module.scss";

interface FaqQuestionsSectionProps {
  userType: 'tenants' | 'landlords';
}

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  user_type: string;
  order: number;
}

const FaqQuestionsSection: FC<FaqQuestionsSectionProps> = ({ userType }) => {
  const { t } = useTranslation();
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const { faqs, isLoading, error } = useFAQ(userType);

  // Используем только данные из API
  const faqItems = faqs;

  const toggleItem = (id: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  // Фильтруем FAQ по типу пользователя
  const filteredFaqItems = faqItems.filter(item => 
    item.user_type === 'both' || item.user_type === userType
  );

  // Сортируем по порядку
  const sortedFaqItems = filteredFaqItems.sort((a, b) => a.order - b.order);

  if (isLoading) {
    return (
      <section className={styles.questionsSection}>
        <div className={styles.container}>
          <h2 className={styles.title}>
            {t("faq.questions.title")}
          </h2>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.questionsSection}>
        <div className={styles.container}>
          <h2 className={styles.title}>
            {t("faq.questions.title")}
          </h2>
          <div className={styles.errorContainer}>
            <p className={styles.errorTitle}>{t("faq.questions.loading_error")}</p>
            <p className={styles.errorDescription}>{t("faq.questions.loading_error_description")}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!isLoading && faqItems.length === 0) {
    return (
      <section className={styles.questionsSection}>
        <div className={styles.container}>
          <h2 className={styles.title}>
            {t("faq.questions.title")}
          </h2>
          <div className={styles.emptyContainer}>
            <p className={styles.emptyTitle}>{t("faq.questions.no_faq")}</p>
            <p className={styles.emptyDescription}>{t("faq.questions.no_faq_description")}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.questionsSection}>
      <div className={styles.container}>
        <h2 className={styles.title}>
          {t("faq.questions.title")}
        </h2>
        
        <div className={styles.faqList}>
          {sortedFaqItems.map((item) => (
            <div
              key={item.id}
              className={styles.faqItem}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className={styles.faqButton}
              >
                <span className={styles.faqQuestion}>
                  {item.question}
                </span>
                <div className="flex-shrink-0 ml-2 sm:ml-0">
                  <svg
                    className={`${styles.faqIcon} ${
                      openItems.has(item.id) ? styles.faqIconOpen : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
              </button>
              
              {openItems.has(item.id) && (
                <div className={styles.faqAnswer}>
                  <p className={styles.faqAnswerText}>
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqQuestionsSection; 