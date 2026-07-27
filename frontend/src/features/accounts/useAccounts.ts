import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Account, CreateAccountPayload, UpdateAccountPayload } from './types';

const ACCOUNTS_KEY = ['accounts'];

export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: async () => {
      const { data } = await api.get<Account[]>('/accounts');
      return data;
    },
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAccountPayload) => {
      const { data } = await api.post<Account>('/accounts', {
        name: payload.name,
        type: payload.type,
        current_balance: payload.currentBalance,
        currency: payload.currency,
        cost_basis: payload.costBasis,
        current_value: payload.currentValue,
        icon: payload.icon,
        color: payload.color,
        account_number_masked: payload.accountNumberMasked,
        interest_rate_annual: payload.interestRateAnnual,
        interest_tax_rate: payload.interestTaxRate,
      });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateAccountPayload }) => {
      const { data } = await api.patch<Account>(`/accounts/${id}`, {
        name: payload.name,
        current_balance: payload.currentBalance,
        cost_basis: payload.costBasis,
        current_value: payload.currentValue,
        account_number_masked: payload.accountNumberMasked,
        interest_rate_annual: payload.interestRateAnnual,
        interest_tax_rate: payload.interestTaxRate,
      });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });
}

export function useToggleHideAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data } = await api.post<Account>(`/accounts/${accountId}/hide`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      await api.delete(`/accounts/${accountId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });
}
