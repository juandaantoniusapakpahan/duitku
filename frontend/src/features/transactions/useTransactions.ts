import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { CreateTransactionPayload, PageResponseDto, Transaction, TransactionType, UpdateTransactionPayload } from './types';

export interface TransactionFilters {
  type?: TransactionType;
  search?: string;
  from?: string;
  to?: string;
  accountId?: string;
  categoryId?: string;
}

const PAGE_SIZE = 20;

export function useTransactionsInfinite(filters: TransactionFilters) {
  return useInfiniteQuery({
    queryKey: ['transactions', filters],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<PageResponseDto<Transaction>>('/transactions', {
        params: { ...filters, page: pageParam, size: PAGE_SIZE, sort: 'occurredAt,desc' },
      });
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.page + 1 < lastPage.total_pages ? lastPage.page + 1 : undefined),
  });
}

function monthRange(monthsAgo: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end =
    monthsAgo === 0 ? now : new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59);
  return { from: start.toISOString(), to: end.toISOString(), start, end };
}

async function fetchAllForRange(from: string, to: string): Promise<Transaction[]> {
  const { data } = await api.get<PageResponseDto<Transaction>>('/transactions', {
    params: { from, to, size: 500, page: 0 },
  });
  return data.content;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export interface TransactionsSummary {
  income: number;
  expense: number;
  transferTotal: number;
  transferCount: number;
  avgPerDay: number;
  daysElapsed: number;
  incomeChangePct: number | null;
  expenseChangePct: number | null;
  transactionCount: number;
}

export function useTransactionsSummary() {
  return useQuery({
    queryKey: ['transactions-summary'],
    queryFn: async (): Promise<TransactionsSummary> => {
      const current = monthRange(0);
      const previous = monthRange(1);
      const [currentTx, previousTx] = await Promise.all([
        fetchAllForRange(current.from, current.to),
        fetchAllForRange(previous.from, previous.to),
      ]);

      const income = currentTx.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
      const expense = currentTx.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
      const transfers = currentTx.filter((t) => t.type === 'TRANSFER');
      const transferTotal = transfers.reduce((s, t) => s + t.amount, 0);

      const prevIncome = previousTx.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
      const prevExpense = previousTx.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

      const daysElapsed = Math.max(1, current.end.getDate());

      return {
        income,
        expense,
        transferTotal,
        transferCount: transfers.length,
        avgPerDay: expense / daysElapsed,
        daysElapsed,
        incomeChangePct: pctChange(income, prevIncome),
        expenseChangePct: pctChange(expense, prevExpense),
        transactionCount: currentTx.length,
      };
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTransactionPayload) => {
      const { data } = await api.post<Transaction[]>('/transactions', {
        type: payload.type,
        amount: payload.amount,
        occurred_at: payload.occurredAt,
        description: payload.description,
        notes: payload.notes,
        account_id: payload.accountId,
        from_account_id: payload.fromAccountId,
        to_account_id: payload.toAccountId,
        category_id: payload.categoryId,
        fee: payload.fee,
        fee_category_id: payload.feeCategoryId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

function invalidateAfterMutation(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['transactions-summary'] });
  queryClient.invalidateQueries({ queryKey: ['accounts'] });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateTransactionPayload }) => {
      const { data } = await api.patch<Transaction>(`/transactions/${id}`, {
        description: payload.description,
        notes: payload.notes,
        occurred_at: payload.occurredAt,
        amount: payload.amount,
        account_id: payload.accountId,
        category_id: payload.categoryId,
      });
      return data;
    },
    onSuccess: () => invalidateAfterMutation(queryClient),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transactions/${id}`);
    },
    onSuccess: () => invalidateAfterMutation(queryClient),
  });
}
