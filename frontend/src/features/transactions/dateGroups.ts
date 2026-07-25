import { differenceInCalendarDays, format, isToday, isYesterday } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Transaction } from './types';

export interface DisplayItem {
  transaction: Transaction;
  fee: Transaction | null;
}

export interface DateGroup {
  key: string;
  title: string;
  subtitle: string;
  totalLabel: string;
  totalClass: string;
  items: DisplayItem[];
}

function toDisplayItems(transactions: Transaction[]): DisplayItem[] {
  const feeByParent = new Map<string, Transaction>();
  for (const tx of transactions) {
    if (tx.parent_transaction_id) feeByParent.set(tx.parent_transaction_id, tx);
  }
  return transactions
    .filter((tx) => !tx.parent_transaction_id)
    .map((tx) => ({ transaction: tx, fee: feeByParent.get(tx.id) ?? null }));
}

function computeDayTotal(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => {
    if (tx.type === 'INCOME') return sum + tx.amount;
    if (tx.type === 'EXPENSE') return sum - tx.amount;
    return sum;
  }, 0);
}

export function groupTransactionsByDate(transactions: Transaction[], formatIDR: (n: number) => string): DateGroup[] {
  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const date = new Date(tx.occurred_at);
    const key = format(date, 'yyyy-MM-dd');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  return Array.from(groups.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, txs]) => {
      const date = new Date(txs[0].occurred_at);
      let title: string;
      let subtitle: string;
      if (isToday(date)) {
        title = 'Hari ini';
        subtitle = format(date, 'EEEE, d MMMM', { locale: id });
      } else if (isYesterday(date)) {
        title = 'Kemarin';
        subtitle = format(date, 'EEEE, d MMMM', { locale: id });
      } else {
        title = format(date, 'EEEE, d MMMM', { locale: id });
        subtitle = `${differenceInCalendarDays(new Date(), date)} hari lalu`;
      }

      const total = computeDayTotal(txs);
      const totalLabel = total === 0 ? formatIDR(0) : `${total > 0 ? '+' : '-'} ${formatIDR(Math.abs(total))}`;
      const totalClass = total > 0 ? 'text-emerald-600' : total < 0 ? 'text-rose-600' : 'text-ink-500';

      return { key, title, subtitle, totalLabel, totalClass, items: toDisplayItems(txs) };
    });
}
