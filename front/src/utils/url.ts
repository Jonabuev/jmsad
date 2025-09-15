// Централизованные функции формирования URL для API и медиа/статических файлов

const rawBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const cleanBase = rawBase.replace(/\/$/, "");

export const apiBaseUrl = `${cleanBase}/api`;
export const mediaBaseUrl = cleanBase;

export const apiUrl = (path: string): string => {
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${apiBaseUrl}/${clean}`;
};

export const mediaUrl = (pathOrUrl: string): string => {
  if (!pathOrUrl) return `${mediaBaseUrl}/media/avatars/def.jpg`;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  if (pathOrUrl.startsWith("/")) return `${mediaBaseUrl}${pathOrUrl}`;
  return `${mediaBaseUrl}/${pathOrUrl}`;
};

export default {
  apiBaseUrl,
  mediaBaseUrl,
  apiUrl,
  mediaUrl,
};

