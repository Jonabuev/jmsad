import { FC } from "react";
import { useTranslation } from "next-i18next";

import FeatureCard from "./feature-card/FeatureCard";

const FeaturesSection: FC = () => {
  const { t } = useTranslation(); // Using the translation hook

  return (
    <section
      id="features"
      className="py-16 px-4 sm:px-8 md:px-12 lg:px-16 bg-slate-100"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
        <FeatureCard
          imageSrc="/home/rental.jpeg"
          title={t("features.registry")}
          description={t("features.registry_description")}
          link="/search"
        />
        <FeatureCard
          imageSrc="/home/forum.jpeg"
          title={t("features.forum")}
          description={t("features.forum_description")}
          link="/forum"
        />
        <FeatureCard
          imageSrc="/home/analytics.png"
          title={t("features.analytics")}
          description={t("features.analytics_description")}
          link="/analitics"
        />
        <FeatureCard
          imageSrc="/home/helps.jpeg"
          title={t("features.help")}
          description={t("features.help_description")}
          link="https://t.me/Helper_serg_bot"
          isExternal
        />
      </div>
    </section>
  );
};

export default FeaturesSection;
