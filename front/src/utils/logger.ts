/**
 * Утилита для логирования с автоматическим отключением в продакшене
 * 
 * Использование:
 * import { logger } from '@/utils/logger';
 * 
 * logger.log('Debug message');
 * logger.error('Error message');
 * logger.warn('Warning message');
 */

const isDevelopment = process.env.NODE_ENV === 'development';

interface Logger {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  group: (label: string) => void;
  groupEnd: () => void;
  table: (data: unknown) => void;
}

export const logger: Logger = {
  /**
   * Обычное логирование (только в development)
   */
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Логирование ошибок (всегда работает)
   */
  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(...args);
    } else {
      // В продакшене можно отправлять в Sentry, LogRocket и т.д.
      // Пример:
      // if (typeof window !== 'undefined' && window.Sentry) {
      //   window.Sentry.captureException(new Error(String(args[0])));
      // }
    }
  },

  /**
   * Предупреждения (только в development)
   */
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Информационные сообщения (только в development)
   */
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Отладочные сообщения (только в development)
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Группировка логов (только в development)
   */
  group: (label: string) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  /**
   * Закрытие группы логов (только в development)
   */
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  /**
   * Табличный вывод (только в development)
   */
  table: (data: unknown) => {
    if (isDevelopment) {
      console.table(data);
    }
  },
};

/**
 * Утилита для логирования производительности
 */
export const performanceLogger = {
  start: (label: string): number => {
    if (isDevelopment && typeof performance !== 'undefined') {
      performance.mark(`${label}-start`);
    }
    return Date.now();
  },

  end: (label: string, startTime?: number): void => {
    if (isDevelopment) {
      if (typeof performance !== 'undefined') {
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
        const measure = performance.getEntriesByName(label)[0];
        logger.log(`⏱️ ${label}: ${measure.duration.toFixed(2)}ms`);
      } else if (startTime) {
        const duration = Date.now() - startTime;
        logger.log(`⏱️ ${label}: ${duration}ms`);
      }
    }
  },
};

export default logger;

