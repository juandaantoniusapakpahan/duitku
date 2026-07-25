import { AlertCircle, AlertTriangle, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { formatIDRCompact } from '../../lib/currency';
import { getColorClasses, getIcon } from '../../lib/icons';
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

export default function BudgetCard({ item }: { item: BudgetProgress }) {
  const category = item.budget.category;
  const Icon = getIcon(category?.icon ?? 'wallet');
  const colors = getColorClasses(category?.color ?? 'ink');
  const meta = STATUS_META[item.status];
  const isOver = item.status === 'over';
  const StatusIcon = meta.Icon;

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
        <button className="text-ink-400 hover:text-ink-600">
          <MoreHorizontal className="w-4 h-4" />
        </button>
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
