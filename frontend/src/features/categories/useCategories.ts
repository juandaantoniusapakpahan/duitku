import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Category, CategoryKind } from './types';

const CATEGORIES_KEY = ['categories'];

export function useCategories(kind?: CategoryKind) {
  return useQuery({
    queryKey: [...CATEGORIES_KEY, kind ?? 'all'],
    queryFn: async () => {
      const { data } = await api.get<Category[]>('/categories', { params: kind ? { kind } : undefined });
      return data;
    },
  });
}

export interface CreateCategoryPayload {
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  icon?: string;
  color?: string;
}

function invalidateCategories(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCategoryPayload) => {
      const { data } = await api.post<Category>('/categories', payload);
      return data;
    },
    onSuccess: () => invalidateCategories(queryClient),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) => {
      const { data } = await api.patch<Category>(`/categories/${id}`, payload);
      return data;
    },
    onSuccess: () => invalidateCategories(queryClient),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => invalidateCategories(queryClient),
  });
}
