import type { NextConfig } from "next";
import { i18n } from "./next-i18next.config"; // 👈 импорт i18n из конфигурации i18next

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Включаем standalone режим для Docker
  images: {
    domains: ["127.0.0.1", "localhost"],
  },
  i18n, // 👈 подключение локалей
  transpilePackages: ['antd', '@ant-design/icons'],
  eslint: {
    // Игнорируем ошибки ESLint при сборке
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Игнорируем ошибки TypeScript при сборке
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
