import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore, type AuthUser } from './auth';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1';

export const api = axios.create({ baseURL, withCredentials: true });

interface RefreshResponse {
  user: AuthUser;
  access_token: string;
}

export async function refreshAccessToken(): Promise<string> {
  const response = await axios.post<RefreshResponse>(
    `${baseURL}/auth/refresh`,
    {},
    { withCredentials: true },
  );
  useAuthStore.getState().setAuth(response.data.user, response.data.access_token);
  return response.data.access_token;
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;
const NO_RETRY_PATTERN = /\/auth\/(login|register|refresh|logout)$/;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const skipRetry = !originalRequest || originalRequest._retry || NO_RETRY_PATTERN.test(originalRequest.url ?? '');

    if (error.response?.status !== 401 || skipRetry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  },
);
