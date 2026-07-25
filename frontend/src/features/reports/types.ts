import type { RefDto, TransactionType } from '../transactions/types';

export interface SummaryData {
  income: number;
  expense: number;
  savings: number;
  savings_rate: number;
  avg_per_day: number;
  transaction_count: number;
}

export interface CategoryAmount {
  category: RefDto | null;
  amount: number;
  pct: number;
}

export interface AccountAmount {
  account: RefDto | null;
  amount: number;
  pct: number;
}

export interface MerchantAmount {
  name: string;
  amount: number;
  count: number;
}

export interface CashflowPoint {
  month: string;
  income: number;
  expense: number;
  savings: number;
}

export interface CategoryComparison {
  category: RefDto | null;
  current: number;
  previous: number;
  change_pct: number;
}

export interface InsightData {
  type: string;
  title: string;
  message: string;
  severity: 'positive' | 'warning' | 'info';
}

export type { TransactionType };
