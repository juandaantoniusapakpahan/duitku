import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type {
  AccountAmount,
  CashflowPoint,
  CategoryAmount,
  CategoryComparison,
  InsightData,
  MerchantAmount,
  SummaryData,
} from './types';
import type { TransactionType } from '../transactions/types';

export interface DateRange {
  from: string;
  to: string;
}

export function useSummary(range: DateRange) {
  return useQuery({
    queryKey: ['reports', 'summary', range],
    queryFn: async () => {
      const { data } = await api.get<SummaryData>('/reports/summary', { params: range });
      return data;
    },
  });
}

export function useByCategory(range: DateRange, kind: TransactionType = 'EXPENSE') {
  return useQuery({
    queryKey: ['reports', 'by-category', range, kind],
    queryFn: async () => {
      const { data } = await api.get<CategoryAmount[]>('/reports/by-category', {
        params: { ...range, kind },
      });
      return data;
    },
  });
}

export function useByAccount(range: DateRange) {
  return useQuery({
    queryKey: ['reports', 'by-account', range],
    queryFn: async () => {
      const { data } = await api.get<AccountAmount[]>('/reports/by-account', { params: range });
      return data;
    },
  });
}

export function useTopMerchants(range: DateRange, limit = 5) {
  return useQuery({
    queryKey: ['reports', 'top-merchants', range, limit],
    queryFn: async () => {
      const { data } = await api.get<MerchantAmount[]>('/reports/top-merchants', {
        params: { ...range, limit },
      });
      return data;
    },
  });
}

export function useCashflowTrend(months = 6) {
  return useQuery({
    queryKey: ['reports', 'cashflow-trend', months],
    queryFn: async () => {
      const { data } = await api.get<CashflowPoint[]>('/reports/cashflow-trend', { params: { months } });
      return data;
    },
  });
}

export function useComparison(range: DateRange, compareRange: DateRange) {
  return useQuery({
    queryKey: ['reports', 'comparison', range, compareRange],
    queryFn: async () => {
      const { data } = await api.get<CategoryComparison[]>('/reports/comparison', {
        params: { ...range, compare_from: compareRange.from, compare_to: compareRange.to },
      });
      return data;
    },
  });
}

export function useInsights() {
  return useQuery({
    queryKey: ['reports', 'insights'],
    queryFn: async () => {
      const { data } = await api.get<InsightData[]>('/reports/insights');
      return data;
    },
  });
}
