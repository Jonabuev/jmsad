import { useState, useEffect } from 'react';
import { getTokenExpiryInfo, getValidAccessToken, getValidRefreshToken, isTokenExpiringSoon } from '@/utils/tokenUtils';

const TokenInfo = () => {
  const [tokenInfo, setTokenInfo] = useState<{
    accessToken: any;
    refreshToken: any;
  } | null>(null);

  useEffect(() => {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') return;

    const updateTokenInfo = () => {
      const accessToken = getValidAccessToken();
      const refreshToken = getValidRefreshToken();

      setTokenInfo({
        accessToken: accessToken ? getTokenExpiryInfo(accessToken) : null,
        refreshToken: refreshToken ? getTokenExpiryInfo(refreshToken) : null,
      });
    };

    updateTokenInfo();
    const interval = setInterval(updateTokenInfo, 1000); // Обновляем каждую секунду

    return () => clearInterval(interval);
  }, []);

  if (!tokenInfo) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
        Нет токенов
      </div>
    );
  }

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const accessToken = getValidAccessToken();
  const isExpiringSoon = accessToken ? isTokenExpiringSoon(accessToken, 5) : false;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-100 border border-gray-400 text-gray-700 px-4 py-2 rounded text-sm max-w-xs">
      <div className="font-bold mb-2">Token Info (Debug)</div>
      
      <div className="mb-2">
        <div className="font-semibold">Access Token:</div>
        {tokenInfo.accessToken ? (
          <div className="text-xs">
            <div>Истек: {tokenInfo.accessToken.isExpired ? 'Да' : 'Нет'}</div>
            <div>Истекает: {tokenInfo.accessToken.expiresAt?.toLocaleString()}</div>
            <div>Осталось: {formatTime(tokenInfo.accessToken.timeUntilExpiry)}</div>
            {isExpiringSoon && (
              <div className="text-orange-600 font-semibold">⚠️ Истекает скоро!</div>
            )}
          </div>
        ) : (
          <div className="text-red-600">Отсутствует</div>
        )}
      </div>
      
      <div>
        <div className="font-semibold">Refresh Token:</div>
        {tokenInfo.refreshToken ? (
          <div className="text-xs">
            <div>Истек: {tokenInfo.refreshToken.isExpired ? 'Да' : 'Нет'}</div>
            <div>Истекает: {tokenInfo.refreshToken.expiresAt?.toLocaleString()}</div>
            <div>Осталось: {formatTime(tokenInfo.refreshToken.timeUntilExpiry)}</div>
          </div>
        ) : (
          <div className="text-red-600">Отсутствует</div>
        )}
      </div>
      
      <div className="mt-2 text-xs text-blue-600">
        🔄 Автообновление: {isExpiringSoon ? 'Активно' : 'Ожидание'}
      </div>
    </div>
  );
};

export default TokenInfo; 