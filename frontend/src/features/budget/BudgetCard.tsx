import { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { formatIDRCompact } from '../../lib/currency';
import { getColorClasses, getIcon } from '../../lib/icons';
import { useDeleteBudget } from './useBudgets';
import type { BudgetProgress } from './types';

const STATUS_META = {
  on_track: { barColor: 'bg-emerald-500', textColor: 'text-emerald-600', label: 'On track', Icon: CheckCircle2 },
  warning: { barColor: 'bg-amber-500', textColor: 'text-amber-600', label: 'Hati-hati (mendekati limit)', Icon: AlertCircle },
  over: { barColor: 'bg-rose-500', textColor: 'text-rose-600', label: 'Melebihi budget', Icon: AlertTriangle },
} as const;

const PERIOD_LABELS: Record<BudgetProgress['budget']['period'], string> = {
  WEEKLY: 'mingguan',
  MONTHLY: 'bulanan',
  YEARLY: 'tahunan',
};

export default function BudgetCard({ item, onEdit }: { item: BudgetProgress; onEdit: () => void }) {
  const category = item.budget.category;
  const Icon = getIcon(category?.icon ?? 'wallet');
  const colors = getColorClasses(category?.color ?? 'ink');
  const meta = STATUS_META[item.status];
  const isOver = item.status === 'over';
  const StatusIcon = meta.Icon;
  const [showMenu, setShowMenu] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deleteBudget = useDeleteBudget();

  return (
    <div className={`bg-white rounded-2xl p-5 card-hover ${isOver ? 'border-2 border-rose-300' : 'border border-ink-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <p className="font-medium">{category?.name ?? 'Kategori'}</p>
            <p className="text-[11px] text-ink-500">Periode {PERIOD_LABELS[item.budget.period]}</p>
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            className="text-ink-400 hover:text-ink-600"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-40 bg-white border border-ink-200 rounded-xl shadow-lg py-1">
                {confirmingDelete ? (
                  <div className="px-3 py-2 flex items-center gap-2">
                    <button
                      onClick={() => setConfirmingDelete(false)}
                      className="flex-1 px-2 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-100 rounded-lg transition"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => deleteBudget.mutate(item.budget.id)}
                      disabled={deleteBudget.isPending}
                      className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition disabled:opacity-60"
                    >
                      {deleteBudget.isPending ? '...' : 'Hapus?'}
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-ink-100 text-left"
                    >
                      <Pencil className="w-3.5 h-3.5 text-ink-500" />
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-ink-100 text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <p className={`text-2xl font-semibold ${isOver ? 'text-rose-600' : ''}`}>{formatIDRCompact(item.spent)}</p>
          <p className="text-xs text-ink-500">dari {formatIDRCompact(item.budget.amount)}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-semibold ${meta.textColor}`}>{item.pct.toFixed(0)}%</p>
          {isOver ? (
            <p className="text-[11px] text-rose-600 font-medium">Over {formatIDRCompact(Math.abs(item.remaining))}</p>
          ) : (
            <p className="text-[11px] text-ink-500">Sisa {formatIDRCompact(item.remaining)}</p>
          )}
        </div>
      </div>
      <div className={`h-2 rounded-full overflow-hidden ${isOver ? 'bg-rose-100' : 'bg-ink-100'}`}>
        <div className={`h-full ${meta.barColor} rounded-full`} style={{ width: `${Math.min(100, item.pct)}%` }} />
      </div>
      <div className="flex items-center justify-between mt-2.5 text-[11px]">
        <span className={`${meta.textColor} font-medium flex items-center gap-1`}>
          <StatusIcon className="w-3 h-3" />
          {meta.label}
        </span>
        <span className="text-ink-500">{item.days_remaining} hari lagi</span>
      </div>
    </div>
  );
}
