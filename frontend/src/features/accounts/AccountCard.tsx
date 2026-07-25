import { ArrowLeftRight, ChartBar, EyeOff, Pencil, RefreshCw, TrendingUp } from 'lucide-react';
import { formatIDR } from '../../lib/currency';
import { getColorClasses, getIcon } from '../../lib/icons';
import { ACCOUNT_TYPE_META } from './constants';
import type { Account } from './types';

export default function AccountCard({ account, onToggleHide }: { account: Account; onToggleHide: (id: string) => void }) {
  const meta = ACCOUNT_TYPE_META[account.type];
  const Icon = getIcon(account.icon);
  const colors = getColorClasses(account.color);
  const isInvestment = account.type === 'INVESTMENT';

  const gain = isInvestment ? (account.current_value ?? 0) - (account.cost_basis ?? 0) : 0;
  const gainPct = isInvestment && account.cost_basis ? (gain / account.cost_basis) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl border border-ink-200 overflow-hidden card-hover group">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${colors.text}`} />
            </div>
            <div>
              <p className="font-semibold">{account.name}</p>
              <p className="text-xs text-ink-500">
                {meta.label}
                {account.account_number_masked ? ` · ${account.account_number_masked}` : ''}
              </p>
            </div>
          </div>
          {isInvestment && account.cost_basis ? (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                gain >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {gain >= 0 ? '+' : ''}
              {gainPct.toFixed(1)}%
            </span>
          ) : null}
        </div>

        <div className={isInvestment ? 'mb-3' : 'mb-4'}>
          <p className="text-xs text-ink-500">{isInvestment ? 'Nilai saat ini' : 'Saldo saat ini'}</p>
          <p className="text-2xl font-semibold">{formatIDR(isInvestment ? (account.current_value ?? 0) : account.current_balance)}</p>
          {isInvestment && account.cost_basis ? (
            <p className={`text-xs mt-0.5 flex items-center gap-1 ${gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              <TrendingUp className="w-3 h-3" />
              {gain >= 0 ? '+' : ''}
              {formatIDR(gain)} dari modal {formatIDR(account.cost_basis)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-3 border-t border-ink-100 divide-x divide-ink-100">
        {isInvestment ? (
          <>
            <button
              disabled
              title="Segera hadir"
              className="py-2.5 text-xs font-medium text-ink-300 cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Update
            </button>
            <button
              disabled
              title="Segera hadir"
              className="py-2.5 text-xs font-medium text-ink-300 cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              disabled
              title="Segera hadir"
              className="py-2.5 text-xs font-medium text-ink-300 cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <ChartBar className="w-3.5 h-3.5" />
              Detail
            </button>
          </>
        ) : (
          <>
            <button
              disabled
              title="Segera hadir"
              className="py-2.5 text-xs font-medium text-ink-300 cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Transaksi
            </button>
            <button
              disabled
              title="Segera hadir"
              className="py-2.5 text-xs font-medium text-ink-300 cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={() => onToggleHide(account.id)}
              className="py-2.5 text-xs font-medium text-ink-600 hover:bg-ink-50 transition flex items-center justify-center gap-1.5"
            >
              <EyeOff className="w-3.5 h-3.5" />
              {account.hidden ? 'Tampilkan' : 'Sembunyi'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
