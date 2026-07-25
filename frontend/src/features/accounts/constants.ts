import type { AccountType } from './types';

export const ACCOUNT_TYPE_META: Record<AccountType, { label: string; icon: string; color: string }> = {
  BANK: { label: 'Bank', icon: 'landmark', color: 'blue' },
  EWALLET: { label: 'E-wallet', icon: 'smartphone', color: 'emerald' },
  CASH: { label: 'Cash', icon: 'banknote', color: 'ink' },
  INVESTMENT: { label: 'Investasi', icon: 'chart-line', color: 'brand' },
};

export const ACCOUNT_TYPE_ORDER: AccountType[] = ['BANK', 'EWALLET', 'CASH', 'INVESTMENT'];
