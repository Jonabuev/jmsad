import type { NextConfig } from "next";
import { i18n } from "./next-i18next.config"; // 👈 импорт i18n из конфигурации i18next

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Включаем standalone режим для Docker
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'backend',
        port: '8000',
        pathname: '/**',
      },
    ],
    unoptimized: true,
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
  publicRuntimeConfig: {
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  },
};

export default nextConfig;
