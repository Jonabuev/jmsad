import axios from "axios";
import Router from "next/router";
import { getValidAccessToken, getValidRefreshToken, clearAllTokens, saveTokens } from "@/utils/tokenUtils";

// Determine API base URL from env with local fallback
const baseFromEnv = process.env.NEXT_PUBLIC_API_URL || "https://api.arno.kz";
const cleanBaseUrl = baseFromEnv ? baseFromEnv.replace(/\/$/, "") : "https://api.armo.kz";
const API_URL = `${cleanBaseUrl}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getValidAccessToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};


api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        })
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getValidRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccessToken = response.data.access;
          saveTokens(newAccessToken, refreshToken);
          api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          clearAllTokens();
          // Не перенаправляем на логин, если мы на главной странице
          if (Router.pathname !== '/') {
            Router.push("/login");
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        clearAllTokens();
        // Не перенаправляем на логин, если мы на главной странице
        if (Router.pathname !== '/') {
          Router.push("/login");
        }
        isRefreshing = false;
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
