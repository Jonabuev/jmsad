import { FC } from "react";
import { useTranslation } from "next-i18next";

const PartnersSection: FC = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 px-4 sm:px-8 md:px-12 lg:px-16 bg-white">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
          {t("partners.title")}
        </h2>
        
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {/* Partner Placeholders */}
          {[1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors duration-300"
            >
              <span className="text-gray-500 text-sm font-medium">
                {t("partners.logo")} {index}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
