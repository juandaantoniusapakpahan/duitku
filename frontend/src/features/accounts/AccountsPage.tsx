import { useMemo, useState } from 'react';
import { EyeOff, Plus } from 'lucide-react';
import { formatIDR, formatIDRCompact } from '../../lib/currency';
import { getColorClasses, getIcon } from '../../lib/icons';
import { useAccounts, useToggleHideAccount } from './useAccounts';
import { ACCOUNT_TYPE_META, ACCOUNT_TYPE_ORDER } from './constants';
import AccountCard from './AccountCard';
import AddAccountModal from './AddAccountModal';
import type { Account, AccountType } from './types';

const FILTERS: { value: AccountType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Semua' },
  ...ACCOUNT_TYPE_ORDER.map((value) => ({ value, label: ACCOUNT_TYPE_META[value].label })),
];

export default function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const toggleHide = useToggleHideAccount();
  const [filter, setFilter] = useState<AccountType | 'ALL'>('ALL');
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const visibleAccounts = useMemo(
    () => accounts.filter((a) => (showHiddenOnly ? a.hidden : !a.hidden)),
    [accounts, showHiddenOnly],
  );

  const filtered = useMemo(
    () => (filter === 'ALL' ? visibleAccounts : visibleAccounts.filter((a) => a.type === filter)),
    [visibleAccounts, filter],
  );

  const grouped = useMemo(() => {
    const map = new Map<AccountType, Account[]>();
    for (const type of ACCOUNT_TYPE_ORDER) map.set(type, []);
    for (const account of filtered) map.get(account.type)?.push(account);
    return map;
  }, [filtered]);

  const totalsByType = useMemo(() => {
    const totals = new Map<AccountType, { sum: number; count: number }>();
    for (const type of ACCOUNT_TYPE_ORDER) totals.set(type, { sum: 0, count: 0 });
    for (const a of accounts.filter((x) => !x.hidden)) {
      const value = a.type === 'INVESTMENT' ? (a.current_value ?? 0) : a.current_balance;
      const bucket = totals.get(a.type);
      if (bucket) {
        bucket.sum += value;
        bucket.count += 1;
      }
    }
    return totals;
  }, [accounts]);

  const netWorth = ACCOUNT_TYPE_ORDER.reduce((sum, type) => sum + (totalsByType.get(type)?.sum ?? 0), 0);
  const hiddenCount = accounts.filter((a) => a.hidden).length;
  const totalCount = accounts.filter((a) => !a.hidden).length;

  const investmentGain = useMemo(() => {
    const investments = accounts.filter((a) => a.type === 'INVESTMENT' && !a.hidden);
    const totalCost = investments.reduce((s, a) => s + (a.cost_basis ?? 0), 0);
    const totalValue = investments.reduce((s, a) => s + (a.current_value ?? 0), 0);
    const gain = totalValue - totalCost;
    const pct = totalCost > 0 ? (gain / totalCost) * 100 : 0;
    return { gain, pct, hasCostBasis: totalCost > 0 };
  }, [accounts]);

  if (isLoading) {
    return (
      <div className="page max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-8">
        <p className="text-sm text-ink-500">Memuat akun...</p>
      </div>
    );
  }

  return (
    <div className="page max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">Akun</h1>
          <p className="text-sm text-ink-500 mt-1">
            {totalCount} akun aktif · Total kekayaan {formatIDR(netWorth)}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah akun
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ACCOUNT_TYPE_ORDER.map((type) => {
          const meta = ACCOUNT_TYPE_META[type];
          const Icon = getIcon(meta.icon);
          const colors = getColorClasses(meta.color);
          const bucket = totalsByType.get(type) ?? { sum: 0, count: 0 };
          const pct = netWorth > 0 ? Math.round((bucket.sum / netWorth) * 100) : 0;
          const isInvestment = type === 'INVESTMENT';
          return (
            <div key={type} className="bg-white rounded-2xl border border-ink-200 p-4 card-hover">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                </div>
                <span className="text-xs text-ink-500 font-medium">{meta.label}</span>
              </div>
              <p className="text-lg lg:text-xl font-semibold">{formatIDRCompact(bucket.sum)}</p>
              <p
                className={`text-[11px] mt-0.5 ${
                  isInvestment && investmentGain.hasCostBasis ? 'text-emerald-600' : 'text-ink-500'
                }`}
              >
                {bucket.count} akun ·{' '}
                {isInvestment && investmentGain.hasCostBasis
                  ? `${investmentGain.pct >= 0 ? '+' : ''}${investmentGain.pct.toFixed(1)}%`
                  : `${pct}%`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => {
          const count =
            f.value === 'ALL' ? visibleAccounts.length : visibleAccounts.filter((a) => a.type === f.value).length;
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                active ? 'bg-ink-900 text-white' : 'hover:bg-ink-100 text-ink-600'
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
        <div className="flex-1" />
        <button
          onClick={() => setShowHiddenOnly((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg whitespace-nowrap transition ${
            showHiddenOnly ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 hover:bg-ink-100'
          }`}
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sembunyi ({hiddenCount})</span>
        </button>
      </div>

      {/* Grouped Sections */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-ink-200 p-10 text-center">
          <p className="text-sm font-medium mb-1">
            {showHiddenOnly ? 'Belum ada akun yang disembunyikan.' : 'Belum ada akun.'}
          </p>
          <p className="text-sm text-ink-500 mb-4">Tambah akun pertama kamu buat mulai tracking keuangan.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah akun
          </button>
        </div>
      ) : (
        ACCOUNT_TYPE_ORDER.filter((type) => (grouped.get(type)?.length ?? 0) > 0).map((type) => {
          const bucket = totalsByType.get(type) ?? { sum: 0, count: 0 };
          const totalLabel =
            type === 'INVESTMENT' && investmentGain.hasCostBasis
              ? `${investmentGain.gain >= 0 ? '+' : ''}${formatIDRCompact(investmentGain.gain)} (${
                  investmentGain.pct >= 0 ? '+' : ''
                }${investmentGain.pct.toFixed(1)}%)`
              : formatIDRCompact(bucket.sum);
          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  {ACCOUNT_TYPE_META[type].label}
                </h3>
                <div className="flex-1 h-px bg-ink-200" />
                <span className={`text-xs ${type === 'INVESTMENT' && investmentGain.gain !== 0 ? 'text-emerald-600 font-medium' : 'text-ink-500'}`}>
                  {totalLabel}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped.get(type)?.map((account) => (
                  <AccountCard key={account.id} account={account} onToggleHide={(id) => toggleHide.mutate(id)} />
                ))}
              </div>
            </div>
          );
        })
      )}

      {showAddModal && <AddAccountModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
