import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { BudgetProgress, CreateBudgetPayload } from './types';

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
