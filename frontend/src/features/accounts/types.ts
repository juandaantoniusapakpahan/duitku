export type AccountType = 'BANK' | 'EWALLET' | 'CASH' | 'INVESTMENT';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  current_balance: number;
  currency: string;
  cost_basis: number | null;
  current_value: number | null;
  icon: string;
  color: string;
  account_number_masked: string | null;
  hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountPayload {
  name: string;
  type: AccountType;
  currentBalance?: number;
  currency?: string;
  costBasis?: number;
  currentValue?: number;
  icon: string;
  color: string;
  accountNumberMasked?: string;
}

export interface UpdateAccountPayload {
  name?: string;
  currentBalance?: number;
  costBasis?: number;
  currentValue?: number;
  accountNumberMasked?: string;
}
