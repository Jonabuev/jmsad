import type { NextConfig } from "next";
import { i18n } from "./next-i18next.config"; // 👈 импорт i18n из конфигурации i18next

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["127.0.0.1", "localhost"],
  },
  i18n, // 👈 подключение локалей
  transpilePackages: ['antd', '@ant-design/icons'],
};

export default nextConfig;
