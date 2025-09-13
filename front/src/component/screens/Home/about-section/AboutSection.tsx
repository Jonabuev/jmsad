import { FC } from "react";
import { useTranslation } from "next-i18next";
import Image from "next/image";

const AboutSection: FC = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 px-4 sm:px-8 md:px-12 lg:px-16 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Logo Section */}
          <Image src="/home/logo.png" alt="logo" width={420} height={105} />

          {/* Content Section */}
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t("about.title")}
            </h2>
            
            <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
              <p>
                {t("about.description1")}
              </p>
              <p>
                {t("about.description2")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
