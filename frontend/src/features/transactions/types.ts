export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface RefDto {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  occurred_at: string;
  description: string | null;
  notes: string | null;
  account: RefDto | null;
  from_account: RefDto | null;
  to_account: RefDto | null;
  category: RefDto | null;
  fee: number;
  fee_category: RefDto | null;
  tags: string[];
  is_recurring: boolean;
  recurrence_rule: string | null;
  parent_transaction_id: string | null;
  created_at: string;
}

export interface PageResponseDto<T> {
  content: T[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

export interface CreateTransactionPayload {
  type: TransactionType;
  amount: number;
  occurredAt?: string;
  description?: string;
  notes?: string;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  categoryId?: string;
  fee?: number;
  feeCategoryId?: string;
}

export interface UpdateTransactionPayload {
  description?: string;
  notes?: string;
  occurredAt?: string;
  amount?: number;
  accountId?: string;
  categoryId?: string;
}
