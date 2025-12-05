/**
 * Web Vitals - мониторинг производительности приложения
 * 
 * Отслеживает ключевые метрики производительности:
 * - LCP (Largest Contentful Paint) - загрузка основного контента
 * - FID (First Input Delay) - время до первого взаимодействия
 * - CLS (Cumulative Layout Shift) - стабильность визуального отображения
 * - FCP (First Contentful Paint) - первая отрисовка
 * - TTFB (Time to First Byte) - время до первого байта
 * 
 * Использование:
 * import { reportWebVitals } from '@/utils/webVitals';
 * reportWebVitals();
 */

import type { Metric } from 'web-vitals';

/**
 * Отправляет метрики в систему аналитики
 */
function sendToAnalytics(metric: Metric) {
  // В development - выводим в консоль
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Web Vital: ${metric.name}`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }

  // В production - отправляем в аналитику
  if (process.env.NODE_ENV === 'production') {
    // Пример: Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
      });
    }

    // ✅ Оптимизация: Отправка метрик на бэкенд (раскомментировать при необходимости)
    // Отправляем только в production и только важные метрики
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Используем sendBeacon для надежной отправки даже при закрытии страницы
      const analyticsData = {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        url: window.location.href,
        timestamp: Date.now(),
      };

      // Используем sendBeacon для критических метрик
      if (navigator.sendBeacon && ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'].includes(metric.name)) {
        const blob = new Blob([JSON.stringify(analyticsData)], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/web-vitals', blob);
      } else {
        // Fallback на fetch
        fetch('/api/analytics/web-vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analyticsData),
          keepalive: true, // Продолжать запрос даже после закрытия страницы
        }).catch(() => {
          // Игнорируем ошибки отправки метрик
        });
      }
    }

    // Пример: Sentry Performance Monitoring
    // if (window.Sentry) {
    //   window.Sentry.metrics.distribution(metric.name, metric.value, {
    //     tags: {
    //       rating: metric.rating,
    //     },
    //   });
    // }
  }
}

/**
 * Отображает метрики в консоли с цветовой индикацией
 */
function logMetricWithRating(metric: Metric) {
  const emoji = {
    good: '🟢',
    'needs-improvement': '🟡',
    poor: '🔴',
  }[metric.rating] || '⚪';

  console.log(
    `${emoji} ${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`
  );
}

/**
 * Инициализирует отслеживание Web Vitals
 */
export function reportWebVitals(onPerfEntry?: (metric: Metric) => void) {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS((metric) => {
        onPerfEntry(metric);
        sendToAnalytics(metric);
      });
      onFID((metric) => {
        onPerfEntry(metric);
        sendToAnalytics(metric);
      });
      onFCP((metric) => {
        onPerfEntry(metric);
        sendToAnalytics(metric);
      });
      onLCP((metric) => {
        onPerfEntry(metric);
        sendToAnalytics(metric);
      });
      onTTFB((metric) => {
        onPerfEntry(metric);
        sendToAnalytics(metric);
      });
      // INP (Interaction to Next Paint) - новая метрика, замена FID
      onINP((metric) => {
        onPerfEntry(metric);
        sendToAnalytics(metric);
      });
    });
  } else {
    // Простая инициализация без callback
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(sendToAnalytics);
      onFID(sendToAnalytics);
      onFCP(sendToAnalytics);
      onLCP(sendToAnalytics);
      onTTFB(sendToAnalytics);
      onINP(sendToAnalytics);
    });
  }
}

/**
 * Отслеживание кастомных метрик производительности
 */
export const customMetrics = {
  /**
   * Измеряет время выполнения операции
   */
  measureOperation: (name: string, operation: () => void) => {
    if (typeof performance !== 'undefined') {
      const start = performance.now();
      operation();
      const duration = performance.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
  },

  /**
   * Измеряет время загрузки изображения
   */
  measureImageLoad: (url: string): Promise<number> => {
    return new Promise((resolve) => {
      const start = performance.now();
      const img = new Image();
      
      img.onload = () => {
        const duration = performance.now() - start;
        if (process.env.NODE_ENV === 'development') {
          console.log(`🖼️ Image loaded (${url}): ${duration.toFixed(2)}ms`);
        }
        resolve(duration);
      };
      
      img.onerror = () => {
        const duration = performance.now() - start;
        console.error(`❌ Image failed (${url}): ${duration.toFixed(2)}ms`);
        resolve(duration);
      };
      
      img.src = url;
    });
  },

  /**
   * Измеряет время API запроса
   */
  measureAPICall: async (name: string, apiCall: () => Promise<any>): Promise<any> => {
    const start = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🌐 API ${name}: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`❌ API ${name} failed: ${duration.toFixed(2)}ms`);
      throw error;
    }
  },
};

export default reportWebVitals;

