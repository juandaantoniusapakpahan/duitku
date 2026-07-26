import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { BudgetProgress, CreateBudgetPayload, UpdateBudgetPayload } from './types';

const BUDGETS_KEY = ['budgets'];

export function useBudgets() {
  return useQuery({
    queryKey: BUDGETS_KEY,
    queryFn: async () => {
      const { data } = await api.get<BudgetProgress[]>('/budgets');
      return data;
    },
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateBudgetPayload) => {
      const { data } = await api.post<BudgetProgress>('/budgets', {
        category_id: payload.categoryId,
        period: payload.period,
        amount: payload.amount,
      });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BUDGETS_KEY }),
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateBudgetPayload }) => {
      const { data } = await api.patch<BudgetProgress>(`/budgets/${id}`, {
        amount: payload.amount,
        end_date: payload.endDate,
      });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BUDGETS_KEY }),
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/budgets/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BUDGETS_KEY }),
  });
}
