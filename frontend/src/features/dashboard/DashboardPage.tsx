import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  ChartLine,
  Eye,
  PiggyBank,
  Plus,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { formatIDR, formatIDRCompact } from '../../lib/currency';
import { getColorClasses, getIcon } from '../../lib/icons';
import { useAuthStore } from '../../lib/auth';
import { useDashboard } from './useDashboard';
import { useCashflowTrend } from '../reports/useReports';
import CashflowChart from '../../components/charts/CashflowChart';
import AddTransactionModal from '../transactions/AddTransactionModal';
import TransactionRow from '../transactions/TransactionRow';
import type { Transaction } from '../transactions/types';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data, isLoading } = useDashboard();
  const { data: trend } = useCashflowTrend(6);
  const [showAddModal, setShowAddModal] = useState(false);

  const today = format(new Date(), 'EEEE, d MMMM yyyy', { locale: id });
  const cashAccounts = data?.accounts.filter((a) => a.type !== 'INVESTMENT' && !a.hidden) ?? [];
  const investmentAccounts = data?.accounts.filter((a) => a.type === 'INVESTMENT' && !a.hidden) ?? [];
  const cashPct = data && data.net_worth > 0 ? Math.round((data.cash_total / data.net_worth) * 100) : 0;
  const investmentPct = data && data.net_worth > 0 ? Math.round((data.investment_total / data.net_worth) * 100) : 0;

  if (isLoading || !data) {
    return (
      <div className="page max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-8">
        <p className="text-sm text-ink-500">Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div className="page max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">Halo, {user?.full_name ?? 'kamu'} 👋</h1>
          <p className="text-sm text-ink-500 mt-1">{today}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah transaksi
        </button>
      </div>

      {/* Hero Net Worth Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-6 lg:p-8 text-white">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-brand-200 mb-1">Total kekayaan bersih</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight">{formatIDR(data.net_worth)}</h2>
                <button className="text-brand-200 hover:text-white transition">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
            {data.investment_gain_pct !== 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full backdrop-blur">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-xs font-medium">
                  {data.investment_gain_pct >= 0 ? '+' : ''}
                  {data.investment_gain_pct.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur border border-white/10">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Wallet className="w-3.5 h-3.5 text-brand-200" />
                <p className="text-xs text-brand-200">Cash &amp; Bank</p>
              </div>
              <p className="text-base lg:text-xl font-semibold">{formatIDR(data.cash_total)}</p>
              <p className="text-[11px] text-brand-200 mt-1">{cashPct}% dari total</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur border border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <ChartLine className="w-3.5 h-3.5 text-brand-200" />
                  <p className="text-xs text-brand-200">Investasi</p>
                </div>
                {data.investment_cost_total > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-medium">
                    {data.investment_gain_pct >= 0 ? '+' : ''}
                    {data.investment_gain_pct.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-base lg:text-xl font-semibold">{formatIDR(data.investment_total)}</p>
              <p className="text-[11px] text-brand-200 mt-1">
                {investmentPct}% · {data.investment_gain_amount >= 0 ? '+' : ''}
                {formatIDRCompact(data.investment_gain_amount)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:gap-6 pt-4 border-t border-white/10">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-400/20 flex items-center justify-center">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <p className="text-xs text-brand-200">Pemasukan</p>
              </div>
              <p className="text-sm lg:text-lg font-semibold">{formatIDR(data.monthly_income)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-rose-400/20 flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-300" />
                </div>
                <p className="text-xs text-brand-200">Pengeluaran</p>
              </div>
              <p className="text-sm lg:text-lg font-semibold">{formatIDR(data.monthly_expense)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                  <PiggyBank className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs text-brand-200">Tabungan</p>
              </div>
              <p className="text-sm lg:text-lg font-semibold">{formatIDR(data.monthly_savings)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-ink-200 p-5 lg:p-6 card-hover">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold">Cashflow</h3>
              <p className="text-xs text-ink-500 mt-0.5">6 bulan terakhir</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                Masuk
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-ink-300" />
                Keluar
              </span>
            </div>
          </div>
          <div className="h-52">{trend && <CashflowChart data={trend} />}</div>
        </div>

        <div className="bg-white rounded-2xl border border-ink-200 p-5 lg:p-6 card-hover">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold">Kategori</h3>
              <p className="text-xs text-ink-500 mt-0.5">Bulan ini</p>
            </div>
          </div>
          {data.top_categories.length === 0 ? (
            <p className="text-sm text-ink-500">Belum ada pengeluaran bulan ini.</p>
          ) : (
            <div className="space-y-4">
              {data.top_categories.map((tc, i) => {
                if (!tc.category) return null;
                const Icon = getIcon(tc.category.icon);
                const colors = getColorClasses(tc.category.color);
                return (
                  <div key={tc.category.id ?? i}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${colors.text}`} />
                        </div>
                        <span className="text-sm font-medium">{tc.category.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{formatIDRCompact(tc.amount)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
                      <div
                        className={`h-full ${colors.solid} rounded-full`}
                        style={{ width: `${Math.min(100, tc.pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Accounts + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-ink-200 p-5 lg:p-6 card-hover">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold">Akun</h3>
            <Link to="/accounts" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              + Tambah
            </Link>
          </div>
          <div className="space-y-3">
            {cashAccounts.map((account) => {
              const Icon = getIcon(account.icon);
              const colors = getColorClasses(account.color);
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-ink-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{account.name}</p>
                      <p className="text-xs text-ink-500">
                        {account.type === 'BANK' ? 'Bank' : account.type === 'EWALLET' ? 'E-wallet' : 'Tunai'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">{formatIDRCompact(account.current_balance)}</p>
                </div>
              );
            })}

            {investmentAccounts.length > 0 && (
              <div className="pt-3 mt-1 border-t border-ink-100">
                <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-ink-400">Investasi</p>
                {investmentAccounts.map((account) => {
                  const Icon = getIcon(account.icon);
                  const colors = getColorClasses(account.color);
                  const gain = (account.current_value ?? 0) - (account.cost_basis ?? 0);
                  const gainPct = account.cost_basis ? (gain / account.cost_basis) * 100 : 0;
                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-ink-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{account.name}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs text-ink-500">Modal {formatIDRCompact(account.cost_basis ?? 0)}</p>
                            {account.cost_basis ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                                {gainPct >= 0 ? '+' : ''}
                                {gainPct.toFixed(1)}%
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatIDRCompact(account.current_value ?? 0)}</p>
                        <p className="text-xs text-emerald-600">
                          {gain >= 0 ? '+' : ''}
                          {formatIDRCompact(gain)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {cashAccounts.length === 0 && investmentAccounts.length === 0 && (
              <p className="text-sm text-ink-500">Belum ada akun.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-ink-200 p-5 lg:p-6 card-hover">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold">Transaksi terbaru</h3>
              <p className="text-xs text-ink-500 mt-0.5">5 transaksi terakhir</p>
            </div>
            <Link
              to="/transactions"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Semua transaksi <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data.recent_transactions.length === 0 ? (
            <p className="text-sm text-ink-500">Belum ada transaksi.</p>
          ) : (
            <div className="divide-y divide-ink-100">
              {data.recent_transactions.map((tx: Transaction) => (
                <TransactionRow key={tx.id} item={{ transaction: tx, fee: null }} onEdit={() => navigate('/transactions')} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && <AddTransactionModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
