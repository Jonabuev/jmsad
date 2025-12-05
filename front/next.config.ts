import type { NextConfig } from "next";
import { i18n } from "./next-i18next.config"; // 👈 импорт i18n из конфигурации i18next

// ✅ Оптимизация: Bundle Analyzer
let withBundleAnalyzer: any = (config: any) => config;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch (error) {
  console.warn('Bundle Analyzer не установлен, пропускаем:', error);
}

// ✅ Оптимизация: PWA (Service Worker)
// Примечание: next-pwa может требовать обновления для Next.js 15
// Если возникают проблемы, можно временно отключить или использовать альтернативу
let withPWA: any = (config: any) => config;
try {
  if (process.env.NODE_ENV === 'production') {
    withPWA = require('next-pwa')({
      dest: 'public',
      register: true,
      skipWaiting: true,
      disable: false,
      buildExcludes: [/app-build-manifest\.json$/],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/api\.arno\.kz\/api\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60, // 1 час
            },
            networkTimeoutSeconds: 10,
          },
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'image-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 дней
            },
          },
        },
      ],
    });
  }
} catch (error) {
  console.warn('PWA plugin не загружен, пропускаем:', error);
}

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

// ✅ Экспортируем конфигурацию с Bundle Analyzer и PWA
// Применяем плагины последовательно
let config: NextConfig = nextConfig;
config = withBundleAnalyzer(config);
config = withPWA(config);
export default config;
