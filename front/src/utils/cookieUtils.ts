/**
 * Утилиты для работы с cookies
 * Поддерживает как клиентскую, так и серверную сторону (SSR)
 */

interface CookieOptions {
  expires?: number | Date; // дни или конкретная дата
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Устанавливает cookie
 * @param name - имя cookie
 * @param value - значение cookie
 * @param options - опции cookie (expires, path, domain, secure, sameSite)
 */
export const setCookie = (
  name: string,
  value: string,
  options: CookieOptions = {}
): void => {
  if (typeof window === 'undefined') return;

  const {
    expires = 7, // по умолчанию 7 дней
    path = '/',
    domain,
    secure = false, // для localhost = false
    sameSite = 'lax'
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  // Устанавливаем время истечения
  if (expires) {
    let expiresDate: Date;
    if (typeof expires === 'number') {
      expiresDate = new Date();
      expiresDate.setTime(expiresDate.getTime() + expires * 24 * 60 * 60 * 1000);
    } else {
      expiresDate = expires;
    }
    cookieString += `; expires=${expiresDate.toUTCString()}`;
  }

  if (path) {
    cookieString += `; path=${path}`;
  }

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  if (secure) {
    cookieString += '; secure';
  }

  if (sameSite) {
    cookieString += `; samesite=${sameSite}`;
  }

  document.cookie = cookieString;
};

/**
 * Получает значение cookie по имени
 * @param name - имя cookie
 * @returns значение cookie или null если не найдено
 */
export const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;

  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }

  return null;
};

/**
 * Удаляет cookie
 * @param name - имя cookie
 * @param path - путь cookie (по умолчанию '/')
 * @param domain - домен cookie
 */
export const deleteCookie = (name: string, path: string = '/', domain?: string): void => {
  if (typeof window === 'undefined') return;

  let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  
  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  document.cookie = cookieString;
};

/**
 * Проверяет существование cookie
 * @param name - имя cookie
 * @returns true если cookie существует
 */
export const hasCookie = (name: string): boolean => {
  return getCookie(name) !== null;
};

/**
 * Получает все cookies в виде объекта
 * @returns объект со всеми cookies
 */
export const getAllCookies = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};

  const cookies: Record<string, string> = {};
  const cookieArray = document.cookie.split(';');

  for (let i = 0; i < cookieArray.length; i++) {
    const cookie = cookieArray[i].trim();
    const [name, value] = cookie.split('=');
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value);
    }
  }

  return cookies;
};

/**
 * Парсит cookies из строки (для SSR)
 * @param cookieString - строка с cookies из request header
 * @returns объект с cookies
 */
export const parseCookieString = (cookieString: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  
  if (!cookieString) return cookies;

  const cookieArray = cookieString.split(';');

  for (let i = 0; i < cookieArray.length; i++) {
    const cookie = cookieArray[i].trim();
    const [name, value] = cookie.split('=');
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value);
    }
  }

  return cookies;
};

/**
 * Получает cookie из запроса на сервере (для SSR)
 * @param cookieString - строка с cookies из request header
 * @param name - имя cookie
 * @returns значение cookie или null
 */
export const getCookieFromRequest = (cookieString: string, name: string): string | null => {
  const cookies = parseCookieString(cookieString);
  return cookies[name] || null;
};

