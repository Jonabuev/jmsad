import Link from "next/link";
import { FC } from "react";
import { useTranslation } from "next-i18next";

const CtaSection: FC = () => {
  const { t } = useTranslation(); // Using the translation hook

  return (
    <section
      id="cta"
      className="py-20 px-4 sm:px-8 md:px-12 lg:px-16 bg-white text-center"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-indigo-900 mb-10 leading-tight">
          {t("cta.register_message_part1")}
          <br />
          {t("cta.register_message_part2")}
        </h2>

        <Link
          href="/register"
          className="inline-block py-4 px-10 text-lg bg-blue-400 text-white rounded-full cursor-pointer no-underline transition duration-300 hover:bg-blue-600 hover:scale-105 mb-8"
        >
          {t("cta.register_button")}
        </Link>
        <p className="text-base text-gray-800">
          {t("cta.already_registered")}
          <Link
            href="/login"
            className="text-blue-600 no-underline font-bold ml-2 hover:underline"
          >
            {t("cta.login_link")}
          </Link>
        </p>
      </div>
    </section>
  );
};

export default CtaSection;
