import { FC } from "react";
import { useTranslation } from "next-i18next";

import FeatureCard from "./feature-card/FeatureCard";

const FeaturesSection: FC = () => {
  const { t } = useTranslation();

  return (
    <section
      id="features"
      className="py-20 px-4 sm:px-8 md:px-12 lg:px-16 bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 animate-pulse">
            Наши услуги
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Выберите нужную вам услугу для работы с нашей платформой
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="transform transition-all duration-700 hover:scale-105">
          <FeatureCard
            imageSrc="url('/home/reaster.png')"
            title={t("features.registry")}
            description={t("features.registry_description")}
            link="/search"
          />
        </div>
        <div className="transform transition-all duration-700 hover:scale-105 delay-100">
          <FeatureCard
            imageSrc="url('/home/maps.png')"
            title={t("features.maps")}
            description={t("features.maps_description")}
            link="/rental-catalog"
          />
        </div>
        <div className="transform transition-all duration-700 hover:scale-105 delay-200">
          <FeatureCard
            imageSrc="url('/home/help.png')"
            title={t("features.help")}
            description={t("features.help_description")}
            link="/faq"
          />
        </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
