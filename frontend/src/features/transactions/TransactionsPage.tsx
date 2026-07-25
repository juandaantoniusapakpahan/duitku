import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Calculator, Download, Filter, Plus, Repeat, Search } from 'lucide-react';
import { formatIDR, formatIDRCompact } from '../../lib/currency';
import { useTransactionsInfinite, useTransactionsSummary } from './useTransactions';
import { groupTransactionsByDate } from './dateGroups';
import TransactionRow from './TransactionRow';
import AddTransactionModal from './AddTransactionModal';
import TransactionFilterPanel from './TransactionFilterPanel';
import TransactionDateFilter, { dateRangeLabel, type DateRange } from './TransactionDateFilter';
import type { Transaction, TransactionType } from './types';

const TYPE_CHIPS: { value: TransactionType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Semua' },
  { value: 'INCOME', label: 'Pemasukan' },
  { value: 'EXPENSE', label: 'Pengeluaran' },
  { value: 'TRANSFER', label: 'Transfer' },
];

function pctLabel(pct: number | null): string {
  if (pct === null) return 'vs bulan lalu';
  const rounded = Math.round(pct);
  return `${rounded >= 0 ? '+' : ''}${rounded}% dari bulan lalu`;
}

export default function TransactionsPage() {
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange>({});

  const filters = useMemo(
    () => ({
      type: typeFilter === 'ALL' ? undefined : typeFilter,
      search: search || undefined,
      accountId,
      categoryId,
      from: dateRange.from,
      to: dateRange.to,
    }),
    [typeFilter, search, accountId, categoryId, dateRange],
  );

  const activeFilterCount = (accountId ? 1 : 0) + (categoryId ? 1 : 0);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useTransactionsInfinite(filters);
  const { data: summary } = useTransactionsSummary();

  const transactions = useMemo(() => data?.pages.flatMap((p) => p.content) ?? [], [data]);
  const totalCount = data?.pages[0]?.total_elements ?? 0;
  const groups = useMemo(() => groupTransactionsByDate(transactions, formatIDR), [transactions]);

  return (
    <div className="page max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">Transaksi</h1>
          <p className="text-sm text-ink-500 mt-1">
            {totalCount} transaksi · {dateRangeLabel(dateRange)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled
            title="Segera hadir"
            className="inline-flex items-center gap-2 px-3 py-2 border border-ink-200 text-ink-300 cursor-not-allowed text-sm font-medium rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-ink-200 p-4 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-xs text-ink-500">Pemasukan</span>
          </div>
          <p className="text-lg lg:text-xl font-semibold">{formatIDRCompact(summary?.income ?? 0)}</p>
          <p className="text-xs text-emerald-600 mt-0.5">{pctLabel(summary?.incomeChangePct ?? null)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-ink-200 p-4 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <span className="text-xs text-ink-500">Pengeluaran</span>
          </div>
          <p className="text-lg lg:text-xl font-semibold">{formatIDRCompact(summary?.expense ?? 0)}</p>
          <p className="text-xs text-rose-600 mt-0.5">{pctLabel(summary?.expenseChangePct ?? null)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-ink-200 p-4 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center">
              <Repeat className="w-3.5 h-3.5 text-brand-600" />
            </div>
            <span className="text-xs text-ink-500">Transfer</span>
          </div>
          <p className="text-lg lg:text-xl font-semibold">{formatIDRCompact(summary?.transferTotal ?? 0)}</p>
          <p className="text-xs text-ink-500 mt-0.5">{summary?.transferCount ?? 0} transaksi</p>
        </div>
        <div className="bg-white rounded-2xl border border-ink-200 p-4 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <Calculator className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-xs text-ink-500">Rata-rata/hari</span>
          </div>
          <p className="text-lg lg:text-xl font-semibold">{formatIDRCompact(summary?.avgPerDay ?? 0)}</p>
          <p className="text-xs text-ink-500 mt-0.5">{summary?.daysElapsed ?? 0} hari</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-ink-200 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari transaksi..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-ink-100 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {TYPE_CHIPS.map((chip) => (
              <button
                key={chip.value}
                onClick={() => setTypeFilter(chip.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                  typeFilter === chip.value ? 'bg-ink-900 text-white' : 'hover:bg-ink-100 text-ink-600'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <TransactionDateFilter value={dateRange} onChange={setDateRange} />
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterPanel((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg transition ${
                activeFilterCount > 0
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-ink-200 text-ink-600 hover:bg-ink-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-brand-600 text-white text-[10px]">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {showFilterPanel && (
              <TransactionFilterPanel
                accountId={accountId}
                categoryId={categoryId}
                onChangeAccount={setAccountId}
                onChangeCategory={setCategoryId}
                onReset={() => {
                  setAccountId(undefined);
                  setCategoryId(undefined);
                }}
                onClose={() => setShowFilterPanel(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Transaction List */}
      {isLoading ? (
        <p className="text-sm text-ink-500">Memuat transaksi...</p>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-ink-200 p-10 text-center">
          <p className="text-sm font-medium mb-1">Belum ada transaksi.</p>
          <p className="text-sm text-ink-500 mb-4">Tambah yang pertama buat mulai tracking.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah transaksi
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.key}>
              <div className="flex items-center justify-between mb-3 px-1">
                <div>
                  <h3 className="text-sm font-semibold">{group.title}</h3>
                  <p className="text-xs text-ink-500">{group.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-500">Total</p>
                  <p className={`text-sm font-semibold ${group.totalClass}`}>{group.totalLabel}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-ink-200 divide-y divide-ink-100">
                {group.items.map((item) => (
                  <TransactionRow
                    key={item.transaction.id}
                    item={item}
                    onEdit={() => setEditingTransaction(item.transaction)}
                  />
                ))}
              </div>
            </div>
          ))}

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-6 py-2.5 bg-white border border-ink-200 hover:bg-ink-100 text-sm font-medium rounded-xl transition disabled:opacity-60"
              >
                {isFetchingNextPage ? 'Memuat...' : 'Muat lebih banyak'}
              </button>
            </div>
          )}
        </div>
      )}

      {showAddModal && <AddTransactionModal onClose={() => setShowAddModal(false)} />}
      {editingTransaction && (
        <AddTransactionModal transaction={editingTransaction} onClose={() => setEditingTransaction(null)} />
      )}
    </div>
  );
}
