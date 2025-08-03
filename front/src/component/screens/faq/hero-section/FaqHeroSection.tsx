import { FC, useState } from "react";
import { useTranslation } from "next-i18next";

const FaqHeroSection: FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'tenants' | 'landlords'>('tenants');

  return (
    <section className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-indigo-100/20"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
          {/* Left side - Text content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-indigo-900 mb-6 sm:mb-8 leading-tight">
              {t("faq.hero.title")}
            </h1>
            
            {/* Tabs */}
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4 mb-6 sm:mb-8">
              <button
                onClick={() => setActiveTab('tenants')}
                className={`px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 shadow-md text-sm sm:text-base touch-manipulation ${
                  activeTab === 'tenants'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:shadow-lg hover:scale-105 active:scale-95'
                }`}
              >
                {t("faq.hero.tenants_tab")}
              </button>
              <button
                onClick={() => setActiveTab('landlords')}
                className={`px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 shadow-md text-sm sm:text-base touch-manipulation ${
                  activeTab === 'landlords'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:shadow-lg hover:scale-105 active:scale-95'
                }`}
              >
                {t("faq.hero.landlords_tab")}
              </button>
            </div>
          </div>

                     {/* Right side - FAQ Image */}
          <div className="relative order-1 lg:order-2">
            <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-blue-200">
              {/* Background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 to-indigo-200/30"></div>
              
              {/* FAQ Image */}
              <div className="relative h-full flex items-center justify-center p-4 sm:p-6 md:p-8">
                <img
                  src="/home/faq.svg"
                  alt="FAQ Illustration"
                  className="w-full h-full object-contain max-w-xs sm:max-w-sm md:max-w-md"
                  style={{
                    filter: 'drop-shadow(0 10px 25px rgba(59, 130, 246, 0.15))'
                  }}
                />
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-2 sm:top-4 right-2 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 bg-blue-400 rounded-full opacity-20"></div>
              <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 w-4 h-4 sm:w-6 sm:h-6 bg-indigo-500 rounded-full opacity-20"></div>
              <div className="absolute top-1/2 left-2 sm:left-4 w-3 h-3 sm:w-4 sm:h-4 bg-blue-300 rounded-full opacity-30"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqHeroSection; 