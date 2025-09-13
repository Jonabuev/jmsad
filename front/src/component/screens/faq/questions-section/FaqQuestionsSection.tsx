import { FC, useState } from "react";
import { useTranslation } from "next-i18next";
import { useFAQ } from "@/hooks/useFAQ";

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
      <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 bg-gradient-to-br from-white to-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-indigo-900 mb-8 sm:mb-12">
            {t("faq.questions.title")}
          </h2>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 bg-gradient-to-br from-white to-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-indigo-900 mb-8 sm:mb-12">
            {t("faq.questions.title")}
          </h2>
          <div className="text-center text-red-600">
            <p className="text-lg mb-4">{t("faq.questions.loading_error")}</p>
            <p className="text-sm">{t("faq.questions.loading_error_description")}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!isLoading && faqItems.length === 0) {
    return (
      <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 bg-gradient-to-br from-white to-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-indigo-900 mb-8 sm:mb-12">
            {t("faq.questions.title")}
          </h2>
          <div className="text-center text-gray-600">
            <p className="text-lg">{t("faq.questions.no_faq")}</p>
            <p className="text-sm">{t("faq.questions.no_faq_description")}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 bg-gradient-to-br from-white to-slate-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-indigo-900 mb-8 sm:mb-12">
          {t("faq.questions.title")}
        </h2>
        
        <div className="space-y-3 sm:space-y-4">
          {sortedFaqItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-blue-100 rounded-lg sm:rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-blue-200"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 text-left flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
              >
                <span className="text-sm sm:text-base md:text-lg font-semibold text-indigo-900 pr-2 sm:pr-4 leading-relaxed">
                  {item.question}
                </span>
                <div className="flex-shrink-0 ml-2 sm:ml-0">
                  <svg
                    className={`w-5 h-5 sm:w-6 sm:h-6 text-blue-600 transition-transform duration-200 ${
                      openItems.has(item.id) ? 'rotate-45' : ''
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
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-t border-blue-100">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
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