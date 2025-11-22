module.exports = {
  i18n: {
    defaultLocale: "ru", // Русский язык по умолчанию
    locales: ["ru", "en", "kz"],
    localeDetection: false, // Отключаем автоматическое определение языка по заголовкам браузера
  },
  react: { useSuspense: false }, // Отключает использование Suspense в React, если у тебя есть проблемы с рендерингом
};
