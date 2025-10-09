import { getCookie, setCookie, deleteCookie } from './cookieUtils';

interface TokenPayload {
  exp: number;
  user_id: number;
  username: string;
  [key: string]: any;
}

/**
 * Декодирует JWT токен и возвращает его payload
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Ошибка декодирования токена:', error);
    return null;
  }
};

/**
 * Проверяет, истек ли токен
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

/**
 * Проверяет, истекает ли токен в ближайшие 5 минут
 */
export const isTokenExpiringSoon = (token: string, minutes: number = 5): boolean => {
  const payload = decodeToken(token);
  if (!payload) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = payload.exp - currentTime;
  return timeUntilExpiry < (minutes * 60);
};

/**
 * Получает access token из cookies и проверяет его валидность
 */
export const getValidAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const token = getCookie('access_token');
  if (!token) return null;
  
  if (isTokenExpired(token)) {
    console.log('Access token истек, удаляем из cookies');
    deleteCookie('access_token');
    return null;
  }
  
  return token;
};

/**
 * Получает refresh token из cookies и проверяет его валидность
 */
export const getValidRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const token = getCookie('refresh_token');
  if (!token) return null;
  
  if (isTokenExpired(token)) {
    console.log('Refresh token истек, удаляем из cookies');
    deleteCookie('refresh_token');
    return null;
  }
  
  return token;
};

/**
 * Очищает все токены из cookies
 */
export const clearAllTokens = (): void => {
  if (typeof window === 'undefined') return;
  
  deleteCookie('access_token');
  deleteCookie('refresh_token');
  deleteCookie('profile');
  deleteCookie('user');
  console.log('Все токены удалены из cookies');
};

/**
 * Проверяет и очищает истекшие токены при загрузке приложения
 */
export const checkAndCleanExpiredTokens = (): void => {
  if (typeof window === 'undefined') return;
  
  const accessToken = getCookie('access_token');
  const refreshToken = getCookie('refresh_token');
  
  if (accessToken && isTokenExpired(accessToken)) {
    console.log('Обнаружен истекший access token, удаляем');
    deleteCookie('access_token');
  }
  
  if (refreshToken && isTokenExpired(refreshToken)) {
    console.log('Обнаружен истекший refresh token, удаляем');
    deleteCookie('refresh_token');
  }
};

/**
 * Сохраняет токены в cookies с проверкой валидности
 */
export const saveTokens = (accessToken: string, refreshToken?: string): void => {
  if (typeof window === 'undefined') return;
  
  if (isTokenExpired(accessToken)) {
    console.error('Попытка сохранить истекший access token');
    return;
  }
  
  // Получаем информацию о сроке действия токена
  const accessTokenInfo = getTokenExpiryInfo(accessToken);
  const accessExpiresDays = accessTokenInfo.timeUntilExpiry 
    ? accessTokenInfo.timeUntilExpiry / (24 * 60 * 60) 
    : 7;
  
  // Сохраняем access token в cookie
  setCookie('access_token', accessToken, {
    expires: accessExpiresDays,
    path: '/',
    secure: false, // для localhost
    sameSite: 'lax'
  });
  
  if (refreshToken && !isTokenExpired(refreshToken)) {
    const refreshTokenInfo = getTokenExpiryInfo(refreshToken);
    const refreshExpiresDays = refreshTokenInfo.timeUntilExpiry 
      ? refreshTokenInfo.timeUntilExpiry / (24 * 60 * 60) 
      : 7;
    
    // Сохраняем refresh token в cookie
    setCookie('refresh_token', refreshToken, {
      expires: refreshExpiresDays,
      path: '/',
      secure: false, // для localhost
      sameSite: 'lax'
    });
  }
  
  console.log('✅ Токены сохранены в cookies');
};

/**
 * Получает информацию о времени истечения токена
 */
export const getTokenExpiryInfo = (token: string): { isExpired: boolean; expiresAt: Date | null; timeUntilExpiry: number | null } => {
  const payload = decodeToken(token);
  if (!payload) {
    return { isExpired: true, expiresAt: null, timeUntilExpiry: null };
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = payload.exp - currentTime;
  const expiresAt = new Date(payload.exp * 1000);
  
  return {
    isExpired: timeUntilExpiry <= 0,
    expiresAt,
    timeUntilExpiry: timeUntilExpiry > 0 ? timeUntilExpiry : null
  };
};

/**
 * Автоматически обновляет access token если он истекает в ближайшие 5 минут
 */
export const autoRefreshToken = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  const accessToken = getValidAccessToken();
  const refreshToken = getValidRefreshToken();
  
  if (!accessToken || !refreshToken) return false;
  
  // Проверяем, истекает ли токен в ближайшие 5 минут
  if (isTokenExpiringSoon(accessToken, 5)) {
    try {
      console.log('Автоматическое обновление access token...');
      const { apiUrl } = await import('./url');
      const response = await fetch(apiUrl('/token/refresh/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        saveTokens(data.access, refreshToken);
        console.log('Access token успешно обновлен');
        return true;
      } else {
        console.error('Ошибка при обновлении токена:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Ошибка при автоматическом обновлении токена:', error);
      return false;
    }
  }
  
  return false;
}; 