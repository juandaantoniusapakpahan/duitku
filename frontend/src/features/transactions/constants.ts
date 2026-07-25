import type { TransactionType } from './types';

export const TX_TYPE_META: Record<TransactionType, { label: string; icon: string }> = {
  INCOME: { label: 'Pemasukan', icon: 'arrow-down-left' },
  EXPENSE: { label: 'Pengeluaran', icon: 'arrow-up-right' },
  TRANSFER: { label: 'Transfer', icon: 'arrow-left-right' },
};
