import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import * as storage from './storage';

const BASE_URL = 'https://motivito-api-production.up.railway.app';

// =============================================
// Axios instances
// =============================================

// Parent API (uses parent JWT)
export const parentApi: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Child API (uses child JWT)
export const childApi: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Public API (no auth needed) — longer timeout to handle Railway cold starts
export const publicApi: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// =============================================
// Interceptors - inject tokens automatically
// =============================================

parentApi.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await storage.getParentAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

childApi.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await storage.getChildAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =============================================
// Response error handler - refresh token if 401
// =============================================

parentApi.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await storage.getParentRefreshToken();
        if (!refreshToken) throw error;
        const res = await publicApi.post('/api/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data;
        await storage.saveParentTokens(accessToken, newRefresh);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return parentApi(original);
      } catch {
        await storage.clearParentData();
        throw error;
      }
    }
    throw error;
  }
);

export { BASE_URL };
