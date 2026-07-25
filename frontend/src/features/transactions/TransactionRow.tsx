import { useState } from 'react';
import { ArrowLeftRight, ArrowRight, Pencil, Receipt, Repeat, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatIDR } from '../../lib/currency';
import { getColorClasses, getIcon } from '../../lib/icons';
import { useDeleteTransaction } from './useTransactions';
import type { DisplayItem } from './dateGroups';

export default function TransactionRow({ item, onEdit }: { item: DisplayItem; onEdit: () => void }) {
  const { transaction: tx, fee } = item;
  const time = format(new Date(tx.occurred_at), 'HH:mm');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deleteTransaction = useDeleteTransaction();

  const actions = confirmingDelete ? (
    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setConfirmingDelete(false)}
        className="px-2 py-1 text-[11px] font-medium text-ink-600 hover:bg-ink-100 rounded-lg transition"
      >
        Batal
      </button>
      <button
        onClick={() => deleteTransaction.mutate(tx.id)}
        disabled={deleteTransaction.isPending}
        className="px-2 py-1 text-[11px] font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition disabled:opacity-60"
      >
        {deleteTransaction.isPending ? '...' : 'Hapus?'}
      </button>
    </div>
  ) : (
    <div
      className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onEdit}
        className="w-7 h-7 rounded-lg hover:bg-ink-100 flex items-center justify-center text-ink-500"
        title="Edit"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setConfirmingDelete(true)}
        className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-ink-500 hover:text-rose-600"
        title="Hapus"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  if (tx.type === 'TRANSFER') {
    const iconName = tx.to_account?.icon ?? 'wallet';
    const color = tx.to_account?.color ?? 'ink';
    const Icon = getIcon(iconName);
    const colors = getColorClasses(color);
    return (
      <div onClick={onEdit} className="group p-4 hover:bg-ink-50 transition cursor-pointer">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0 relative`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center">
              <ArrowLeftRight className={`w-2.5 h-2.5 ${colors.text}`} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{tx.description || 'Transfer'}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} font-medium`}>Transfer</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-ink-500">
              <span>{tx.from_account?.name ?? '—'}</span>
              <ArrowRight className="w-3 h-3" />
              <span>{tx.to_account?.name ?? '—'}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-ink-900">{formatIDR(tx.amount)}</p>
            <p className="text-xs text-ink-500 mt-0.5">{time}</p>
          </div>
          {actions}
        </div>
        {fee && (
          <div className="flex items-center gap-3 mt-2 pl-13 pt-2 border-t border-dashed border-ink-100">
            <div className="w-6 h-6 rounded bg-ink-100 flex items-center justify-center flex-shrink-0 ml-1">
              <Receipt className="w-3.5 h-3.5 text-ink-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-ink-600">{fee.description || 'Fee transfer'}</p>
                {fee.category && (
                  <>
                    <span className="text-[10px] text-ink-400">·</span>
                    <p className="text-[11px] text-ink-500">{fee.category.name}</p>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs font-medium text-rose-600">- {formatIDR(fee.amount)}</p>
          </div>
        )}
      </div>
    );
  }

  const isIncome = tx.type === 'INCOME';
  const Icon = getIcon(tx.category?.icon ?? 'wallet');
  const colors = getColorClasses(tx.category?.color ?? 'ink');

  return (
    <div onClick={onEdit} className="group flex items-center gap-3 p-4 hover:bg-ink-50 transition cursor-pointer">
      <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${colors.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{tx.description || (isIncome ? 'Pemasukan' : 'Pengeluaran')}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {tx.category && <span className="text-xs text-ink-500">{tx.category.name}</span>}
          {tx.category && tx.account && <span className="text-xs text-ink-300">·</span>}
          {tx.account && <span className="text-xs text-ink-500">{tx.account.name}</span>}
          {tx.is_recurring && (
            <>
              <span className="text-xs text-ink-300">·</span>
              <span className="inline-flex items-center gap-1 text-xs text-brand-600">
                <Repeat className="w-3 h-3" />
                Berulang
              </span>
            </>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isIncome ? '+' : '-'} {formatIDR(tx.amount)}
        </p>
        <p className="text-xs text-ink-500 mt-0.5">{time}</p>
      </div>
      {actions}
    </div>
  );
}
