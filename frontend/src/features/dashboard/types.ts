import type { Account } from '../accounts/types';
import type { Transaction } from '../transactions/types';
import type { CategoryAmount } from '../reports/types';

export interface DashboardData {
  net_worth: number;
  cash_total: number;
  investment_total: number;
  investment_cost_total: number;
  investment_gain_amount: number;
  investment_gain_pct: number;
  monthly_income: number;
  monthly_expense: number;
  monthly_savings: number;
  recent_transactions: Transaction[];
  top_categories: CategoryAmount[];
  accounts: Account[];
}
