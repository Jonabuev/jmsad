import type { NextConfig } from "next";
import { i18n } from "./next-i18next.config"; // 👈 импорт i18n из конфигурации i18next

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Включаем standalone режим для Docker
  images: {
    remotePatterns: [
      // Локальные адреса для разработки
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
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
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'backend',
        port: '8000',
        pathname: '/**',
      },
      // Тестовый адрес
      {
        protocol: 'https',
        hostname: 'api.dev.arno.kz',
        port: '',
        pathname: '/**',
      },
      // Продакшн адреса
      {
        protocol: 'https',
        hostname: 'api.arno.kz',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'api.arno.kz',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  i18n, // 👈 подключение локалей
  transpilePackages: ['antd', '@ant-design/icons'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  publicRuntimeConfig: {
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Оптимизация производительности
  compress: true,
  poweredByHeader: false,
  // Экспериментальные оптимизации
  // ВНИМАНИЕ: optimizeCss требует установки 'critters': npm install critters --save-dev
  // Если возникают проблемы, можно временно отключить эту опцию
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
