import { FC, useState } from "react";
import { useTranslation } from "next-i18next";

interface FaqItem {
  key: string;
  question: string;
  answer: string;
}

const FaqQuestionsSection: FC = () => {
  const { t } = useTranslation();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const faqItems: FaqItem[] = [
    {
      key: "data_update",
      question: t("faq.questions.items.data_update.question"),
      answer: t("faq.questions.items.data_update.answer")
    },
    {
      key: "data_source",
      question: t("faq.questions.items.data_source.question"),
      answer: t("faq.questions.items.data_source.answer")
    },
    {
      key: "site_purpose",
      question: t("faq.questions.items.site_purpose.question"),
      answer: t("faq.questions.items.site_purpose.answer")
    },
    {
      key: "complaint_limit",
      question: t("faq.questions.items.complaint_limit.question"),
      answer: t("faq.questions.items.complaint_limit.answer")
    },
    {
      key: "notification_subscription",
      question: t("faq.questions.items.notification_subscription.question"),
      answer: t("faq.questions.items.notification_subscription.answer")
    },
    {
      key: "verified_profile",
      question: t("faq.questions.items.verified_profile.question"),
      answer: t("faq.questions.items.verified_profile.answer")
    },
    {
      key: "court_usage",
      question: t("faq.questions.items.court_usage.question"),
      answer: t("faq.questions.items.court_usage.answer")
    },
    {
      key: "confidentiality",
      question: t("faq.questions.items.confidentiality.question"),
      answer: t("faq.questions.items.confidentiality.answer")
    },
    {
      key: "delete_complaint",
      question: t("faq.questions.items.delete_complaint.question"),
      answer: t("faq.questions.items.delete_complaint.answer")
    },
    {
      key: "incorrect_info",
      question: t("faq.questions.items.incorrect_info.question"),
      answer: t("faq.questions.items.incorrect_info.answer")
    }
  ];

  const toggleItem = (key: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(key)) {
      newOpenItems.delete(key);
    } else {
      newOpenItems.add(key);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 bg-gradient-to-br from-white to-slate-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-indigo-900 mb-8 sm:mb-12">
          {t("faq.questions.title")}
        </h2>
        
                 <div className="space-y-3 sm:space-y-4">
           {faqItems.map((item) => (
             <div
               key={item.key}
               className="bg-white border border-blue-100 rounded-lg sm:rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-blue-200"
             >
               <button
                 onClick={() => toggleItem(item.key)}
                 className="w-full px-4 sm:px-6 py-3 sm:py-4 text-left flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
               >
                 <span className="text-sm sm:text-base md:text-lg font-semibold text-indigo-900 pr-2 sm:pr-4 leading-relaxed">
                   {item.question}
                 </span>
                 <div className="flex-shrink-0 ml-2 sm:ml-0">
                   <svg
                     className={`w-5 h-5 sm:w-6 sm:h-6 text-blue-600 transition-transform duration-200 ${
                       openItems.has(item.key) ? 'rotate-45' : ''
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
               
               {openItems.has(item.key) && (
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