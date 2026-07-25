import { useMemo, useState } from 'react';
import { format, startOfDay, startOfMonth, startOfWeek, startOfYear, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  Download,
  Hash,
  Percent,
  PiggyBank,
  Printer,
  Receipt,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { formatIDR, formatIDRCompact } from '../../lib/currency';
import { getColorClasses, getIcon } from '../../lib/icons';
import TrendLineChart from '../../components/charts/TrendLineChart';
import CategoryDonut from '../../components/charts/CategoryDonut';
import { useByAccount, useByCategory, useCashflowTrend, useComparison, useInsights, useSummary } from './useReports';
import { useTransactionsInfinite } from '../transactions/useTransactions';

type PeriodPreset = 'today' | 'week' | 'month' | '3m' | '6m' | 'year' | 'all';

const PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: 'today', label: 'Hari ini' },
  { value: 'week', label: 'Minggu ini' },
  { value: 'month', label: 'Bulan ini' },
  { value: '3m', label: '3 bulan' },
  { value: '6m', label: '6 bulan' },
  { value: 'year', label: 'Tahun ini' },
  { value: 'all', label: 'Semua' },
];

function getRange(preset: PeriodPreset): { from: Date; to: Date } {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: now };
    case 'week':
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: now };
    case '3m':
      return { from: startOfMonth(subMonths(now, 2)), to: now };
    case '6m':
      return { from: startOfMonth(subMonths(now, 5)), to: now };
    case 'year':
      return { from: startOfYear(now), to: now };
    case 'all':
      return { from: new Date(2020, 0, 1), to: now };
    default:
      return { from: startOfMonth(now), to: now };
  }
}

function pctBadge(pct: number | null, invert = false): { label: string; positive: boolean } {
  if (pct === null) return { label: '–', positive: true };
  const positive = invert ? pct <= 0 : pct >= 0;
  return { label: `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`, positive };
}

const INSIGHT_ICON: Record<string, typeof TrendingUp> = {
  savings_rate: TrendingUp,
  category_spike: AlertTriangle,
  bank_fee: Receipt,
};

export default function ReportsPage() {
  const [preset, setPreset] = useState<PeriodPreset>('month');

  const range = useMemo(() => getRange(preset), [preset]);
  const rangeIso = { from: range.from.toISOString(), to: range.to.toISOString() };
  const compareRange = useMemo(() => {
    const durationMs = range.to.getTime() - range.from.getTime();
    const compareTo = new Date(range.from.getTime());
    const compareFrom = new Date(range.from.getTime() - durationMs);
    return { from: compareFrom.toISOString(), to: compareTo.toISOString() };
  }, [range]);

  const { data: summary } = useSummary(rangeIso);
  const { data: prevSummary } = useSummary(compareRange);
  const { data: categoryBreakdown = [] } = useByCategory(rangeIso, 'EXPENSE');
  const { data: accountBreakdown = [] } = useByAccount(rangeIso);
  const { data: trend } = useCashflowTrend(6);
  const { data: comparison = [] } = useComparison(rangeIso, compareRange);
  const { data: insights = [] } = useInsights();
  const { data: txPages, fetchNextPage, hasNextPage, isFetchingNextPage } = useTransactionsInfinite(rangeIso);

  const transactions = useMemo(() => txPages?.pages.flatMap((p) => p.content) ?? [], [txPages]);
  const totalTxCount = txPages?.pages[0]?.total_elements ?? 0;

  const incomeChange = prevSummary && summary && prevSummary.income > 0
    ? ((summary.income - prevSummary.income) / prevSummary.income) * 100
    : null;
  const expenseChange = prevSummary && summary && prevSummary.expense > 0
    ? ((summary.expense - prevSummary.expense) / prevSummary.expense) * 100
    : null;
  const savingsChange = prevSummary && summary && prevSummary.savings !== 0
    ? ((summary.savings - prevSummary.savings) / Math.abs(prevSummary.savings)) * 100
    : null;

  const periodLabel = format(range.from, 'd MMM', { locale: id }) + ' – ' + format(range.to, 'd MMM yyyy', { locale: id });
  const biggestCategory = categoryBreakdown[0];

  return (
    <div className="page max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">Laporan</h1>
          <p className="text-sm text-ink-500 mt-1">Analisis keuangan {periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled
            title="Segera hadir"
            className="inline-flex items-center gap-2 px-3 py-2 border border-ink-200 text-ink-300 cursor-not-allowed text-sm font-medium rounded-xl transition"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
          <button
            disabled
            title="Segera hadir"
            className="inline-flex items-center gap-2 px-4 py-2 bg-ink-900 text-white text-sm font-medium rounded-xl transition shadow-sm opacity-60 cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-ink-200 p-4 space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-medium text-ink-500 whitespace-nowrap mr-1">Periode:</span>
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                preset === p.value ? 'bg-ink-900 text-white' : 'hover:bg-ink-100 text-ink-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-ink-200 p-4 lg:p-5 card-hover">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs text-ink-500 font-medium">Pemasukan</span>
          </div>
          <p className="text-xl lg:text-2xl font-semibold">{formatIDR(summary?.income ?? 0)}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
              {pctBadge(incomeChange).label}
            </span>
            <span className="text-[11px] text-ink-500">vs periode sebelumnya</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-ink-200 p-4 lg:p-5 card-hover">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
            </div>
            <span className="text-xs text-ink-500 font-medium">Pengeluaran</span>
          </div>
          <p className="text-xl lg:text-2xl font-semibold">{formatIDR(summary?.expense ?? 0)}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                pctBadge(expenseChange, true).positive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {pctBadge(expenseChange, true).label}
            </span>
            <span className="text-[11px] text-ink-500">vs periode sebelumnya</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-ink-200 p-4 lg:p-5 card-hover">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
              <PiggyBank className="w-4 h-4 text-brand-600" />
            </div>
            <span className="text-xs text-ink-500 font-medium">Net savings</span>
          </div>
          <p className="text-xl lg:text-2xl font-semibold">{formatIDR(summary?.savings ?? 0)}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
              {pctBadge(savingsChange).label}
            </span>
            <span className="text-[11px] text-ink-500">vs periode sebelumnya</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-ink-200 p-4 lg:p-5 card-hover">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Percent className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs text-ink-500 font-medium">Savings rate</span>
          </div>
          <p className="text-xl lg:text-2xl font-semibold">{(summary?.savings_rate ?? 0).toFixed(1)}%</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[11px] text-ink-500">Target: 25%</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-ink-200 p-4 lg:p-5 card-hover">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-cyan-600" />
            </div>
            <span className="text-xs text-ink-500 font-medium">Rata-rata/hari</span>
          </div>
          <p className="text-xl lg:text-2xl font-semibold">{formatIDR(summary?.avg_per_day ?? 0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-ink-200 p-4 lg:p-5 card-hover">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
              <Hash className="w-4 h-4 text-pink-600" />
            </div>
            <span className="text-xs text-ink-500 font-medium">Transaksi</span>
          </div>
          <p className="text-xl lg:text-2xl font-semibold">{summary?.transaction_count ?? 0}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-ink-200 p-5 lg:p-6 card-hover">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <div>
              <h3 className="text-base font-semibold">Trend Cashflow</h3>
              <p className="text-xs text-ink-500 mt-0.5">6 bulan terakhir</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Pemasukan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Pengeluaran
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                Savings
              </span>
            </div>
          </div>
          <div className="h-64">{trend && <TrendLineChart data={trend} />}</div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-ink-200 p-5 lg:p-6 card-hover">
          <div className="mb-4">
            <h3 className="text-base font-semibold">Pengeluaran per kategori</h3>
            <p className="text-xs text-ink-500 mt-0.5">Total {formatIDRCompact(summary?.expense ?? 0)}</p>
          </div>
          <div className="h-56 relative">
            {categoryBreakdown.length > 0 ? (
              <>
                <CategoryDonut data={categoryBreakdown} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-[11px] text-ink-500">Terbesar</p>
                    <p className="text-sm font-semibold">{biggestCategory?.category?.name ?? '—'}</p>
                    <p className="text-xs text-ink-500">{biggestCategory?.pct.toFixed(1) ?? 0}%</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-500 flex items-center justify-center h-full">Belum ada data.</p>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-2xl border border-ink-200 p-5 lg:p-6 card-hover">
        <div className="mb-5">
          <h3 className="text-base font-semibold">Perbandingan periode</h3>
          <p className="text-xs text-ink-500 mt-0.5">Periode ini vs periode sebelumnya</p>
        </div>
        {comparison.length === 0 ? (
          <p className="text-sm text-ink-500">Belum ada data untuk dibandingkan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-500 border-b border-ink-200">
                  <th className="pb-3 font-medium">Kategori</th>
                  <th className="pb-3 font-medium text-right">Periode ini</th>
                  <th className="pb-3 font-medium text-right">Sebelumnya</th>
                  <th className="pb-3 font-medium text-right">Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {comparison.map((c, i) => {
                  if (!c.category) return null;
                  const Icon = getIcon(c.category.icon);
                  const colors = getColorClasses(c.category.color);
                  const isIncrease = c.change_pct > 0;
                  return (
                    <tr key={c.category.id ?? i}>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center`}>
                            <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                          </div>
                          <span className="font-medium">{c.category.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right font-medium">{formatIDR(c.current)}</td>
                      <td className="py-3 text-right text-ink-500">{formatIDR(c.previous)}</td>
                      <td className="py-3 text-right">
                        <span className={`font-medium ${isIncrease ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isIncrease ? '+' : ''}
                          {c.change_pct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Breakdown + Account Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-ink-200 p-5 lg:p-6 card-hover">
          <div className="mb-5">
            <h3 className="text-base font-semibold">Breakdown kategori</h3>
            <p className="text-xs text-ink-500 mt-0.5">Pengeluaran per kategori</p>
          </div>
          {categoryBreakdown.length === 0 ? (
            <p className="text-sm text-ink-500">Belum ada pengeluaran.</p>
          ) : (
            <div className="space-y-4">
              {categoryBreakdown.map((c, i) => {
                if (!c.category) return null;
                const Icon = getIcon(c.category.icon);
                const colors = getColorClasses(c.category.color);
                return (
                  <div key={c.category.id ?? i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center`}>
                          <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                        </div>
                        <p className="text-sm font-medium">{c.category.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatIDRCompact(c.amount)}</p>
                        <p className="text-[11px] text-ink-500">{c.pct.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
                      <div className={`h-full ${colors.solid} rounded-full`} style={{ width: `${Math.min(100, c.pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-ink-200 p-5 lg:p-6 card-hover">
          <div className="mb-5">
            <h3 className="text-base font-semibold">Pengeluaran per akun</h3>
            <p className="text-xs text-ink-500 mt-0.5">Mana yang paling sering pakai</p>
          </div>
          {accountBreakdown.length === 0 ? (
            <p className="text-sm text-ink-500">Belum ada pengeluaran.</p>
          ) : (
            <div className="space-y-3">
              {accountBreakdown.map((a, i) => {
                if (!a.account) return null;
                const Icon = getIcon(a.account.icon);
                const colors = getColorClasses(a.account.color);
                return (
                  <div key={a.account.id ?? i} className="flex items-center justify-between p-3 rounded-xl bg-ink-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${colors.text}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{a.account.name}</p>
                        <p className="text-[11px] text-ink-500">{a.pct.toFixed(0)}% dari total</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">{formatIDRCompact(a.amount)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-br from-brand-50 to-purple-50 rounded-2xl border border-brand-200 p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-base font-semibold">Insights bulan ini</h3>
        </div>
        {insights.length === 0 ? (
          <p className="text-sm text-ink-600">Belum ada insight buat bulan ini.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, i) => {
              const Icon = INSIGHT_ICON[insight.type] ?? Sparkles;
              const isPositive = insight.severity === 'positive';
              return (
                <div key={i} className="p-4 bg-white/70 rounded-xl backdrop-blur border border-white">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isPositive ? 'bg-emerald-100' : 'bg-rose-100'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs text-ink-500 mt-1">{insight.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Transaction Table */}
      <div className="bg-white rounded-2xl border border-ink-200 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-ink-200">
          <div>
            <h3 className="text-base font-semibold">Semua transaksi</h3>
            <p className="text-xs text-ink-500 mt-0.5">{totalTxCount} transaksi sesuai filter</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50">
              <tr className="text-left text-xs text-ink-500">
                <th className="px-5 py-3 font-medium">Tanggal</th>
                <th className="px-5 py-3 font-medium">Deskripsi</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Kategori</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Akun</th>
                <th className="px-5 py-3 font-medium text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {transactions.map((tx) => {
                const Icon = getIcon(tx.type === 'TRANSFER' ? (tx.to_account?.icon ?? 'wallet') : (tx.category?.icon ?? 'wallet'));
                const colors = getColorClasses(tx.type === 'TRANSFER' ? (tx.to_account?.color ?? 'ink') : (tx.category?.color ?? 'ink'));
                const isIncome = tx.type === 'INCOME';
                const isTransfer = tx.type === 'TRANSFER';
                return (
                  <tr key={tx.id} className="hover:bg-ink-50 transition cursor-pointer">
                    <td className="px-5 py-3 text-xs text-ink-500 whitespace-nowrap">
                      {format(new Date(tx.occurred_at), 'd MMM, HH:mm', { locale: id })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center`}>
                          <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                        </div>
                        <span className="font-medium">{tx.description || (isTransfer ? 'Transfer' : isIncome ? 'Pemasukan' : 'Pengeluaran')}</span>
                        {isTransfer && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 font-medium">
                            Transfer
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-ink-600">{tx.category?.name ?? '—'}</td>
                    <td className="px-5 py-3 hidden lg:table-cell text-ink-600">
                      {isTransfer ? `${tx.from_account?.name ?? '—'} → ${tx.to_account?.name ?? '—'}` : tx.account?.name ?? '—'}
                    </td>
                    <td
                      className={`px-5 py-3 text-right font-semibold whitespace-nowrap ${
                        isTransfer ? 'text-ink-900' : isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isTransfer ? '' : isIncome ? '+ ' : '- '}
                      {formatIDR(tx.amount)}
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-sm text-ink-500">
                    Belum ada transaksi di periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {hasNextPage && (
          <div className="p-4 border-t border-ink-200 flex items-center justify-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-6 py-2 bg-white border border-ink-200 hover:bg-ink-100 text-sm font-medium rounded-xl transition disabled:opacity-60"
            >
              {isFetchingNextPage ? 'Memuat...' : 'Muat lebih banyak'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
