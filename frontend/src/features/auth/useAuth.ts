import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '../../lib/api';
import { useAuthStore, type AuthUser } from '../../lib/auth';

interface TokenResponse {
  user: AuthUser;
  access_token: string;
}

interface ApiErrorBody {
  message?: string;
  field_errors?: Record<string, string>;
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.message) return body.message;
  }
  return fallback;
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const { data } = await api.post<TokenResponse>('/auth/login', payload);
      return data;
    },
    onSuccess: (data) => setAuth(data.user, data.access_token),
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (payload: { email: string; password: string; fullName: string }) => {
      const { data } = await api.post<TokenResponse>('/auth/register', {
        email: payload.email,
        password: payload.password,
        full_name: payload.fullName,
      });
      return data;
    },
    onSuccess: (data) => setAuth(data.user, data.access_token),
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => clearAuth(),
  });
}
