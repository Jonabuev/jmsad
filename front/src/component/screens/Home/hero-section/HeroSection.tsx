import { FC } from "react";
import { useTranslation } from "next-i18next";

const HeroSection: FC = () => {
  const { t } = useTranslation(); // Using the translation hook

  return (
    <section className="relative flex items-center justify-center text-center overflow-x-hidden pt-[80px]">
      <video
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        autoPlay
        muted
        loop
        playsInline
        poster="/home/hero.mp4"
      >
        <source src="/home/hero.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="absolute top-0 left-0 w-full h-full bg-black/30 z-10"></div>

      <div className="relative text-white z-20 px-5">
        <h2 className="text-2xl md:text-3xl font-light mb-5 md:mb-10 text-shadow-md">
          {t("hero.free_and_available")}
        </h2>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-10 uppercase text-shadow-lg">
          {t("hero.check_potential_tenant")}
        </h1>
        <a
          href="https://portal.kgd.gov.kz/pages/info-services/info-absence-tax-debt"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block py-4 px-10 text-lg bg-blue-600 text-white rounded-full cursor-pointer no-underline transition duration-300 hover:scale-105 hover:bg-blue-700"
        >
          {t("hero.start_checking")}
        </a>
      </div>
    </section>
  );
};

export default HeroSection;
