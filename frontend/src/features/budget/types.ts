import type { RefDto } from '../transactions/types';

export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type BudgetStatus = 'on_track' | 'warning' | 'over';

export interface BudgetRef {
  id: string;
  category: RefDto | null;
  period: BudgetPeriod;
  amount: number;
  start_date: string;
  end_date: string | null;
}

export interface BudgetProgress {
  budget: BudgetRef;
  spent: number;
  remaining: number;
  pct: number;
  status: BudgetStatus;
  days_remaining: number;
}

export interface CreateBudgetPayload {
  categoryId: string;
  period: BudgetPeriod;
  amount: number;
}
