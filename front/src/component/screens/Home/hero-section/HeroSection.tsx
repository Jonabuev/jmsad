import { FC } from "react";
import { useTranslation } from "next-i18next";

const HeroSection: FC = () => {
  const { t } = useTranslation();

  return (
    <section className="relative flex items-center justify-center text-center overflow-x-hidden pt-[80px] min-h-[70vh]">
      {/* Background Image */}
      <div 
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: "url('/hero-img.jpg')",
          filter: "blur(2px)"
        }}
      />

      {/* Overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/40 z-10"></div>

      {/* Content */}
      <div className="relative text-white z-20 px-5 max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-light mb-5 md:mb-8 text-shadow-md">
          {t("hero.free_and_available")}
        </h2>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-10 md:mb-12 uppercase text-shadow-lg leading-tight">
          {t("hero.check_potential_tenant")}
        </h1>
        <a
          href="/search"
          className="inline-block py-4 px-10 text-lg bg-blue-600 text-white rounded-xl cursor-pointer no-underline transition duration-300 hover:scale-105 hover:bg-blue-700 shadow-lg"
        >
          {t("hero.start_checking")}
        </a>
      </div>
    </section>
  );
};

export default HeroSection;
