import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { AlertTriangle, Calendar, CheckCircle, ChevronLeft, ChevronRight, Lightbulb, Plus } from 'lucide-react';
import { formatIDR } from '../../lib/currency';
import { useBudgets } from './useBudgets';
import BudgetCard from './BudgetCard';
import AddBudgetModal from './AddBudgetModal';

export default function BudgetPage() {
  const { data: budgets = [], isLoading } = useBudgets();
  const [showAddModal, setShowAddModal] = useState(false);
  const monthLabel = format(new Date(), 'MMMM yyyy', { locale: id });

  const totals = useMemo(() => {
    const totalBudget = budgets.reduce((s, b) => s + b.budget.amount, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
    const pct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const remaining = totalBudget - totalSpent;
    const minDaysRemaining = budgets.length > 0 ? Math.min(...budgets.map((b) => b.days_remaining)) : 0;
    return { totalBudget, totalSpent, pct, remaining, minDaysRemaining };
  }, [budgets]);

  const overBudget = budgets.filter((b) => b.status === 'over');

  if (isLoading) {
    return (
      <div className="page max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-8">
        <p className="text-sm text-ink-500">Memuat budget...</p>
      </div>
    );
  }

  return (
    <div className="page max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">Budget</h1>
          <p className="text-sm text-ink-500 mt-1">Atur target pengeluaran per kategori</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled
            title="Segera hadir"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-ink-200 text-ink-300 cursor-not-allowed text-sm font-medium rounded-xl transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled
            title="Segera hadir"
            className="inline-flex items-center gap-2 px-3 py-2 border border-ink-200 text-ink-300 cursor-not-allowed text-sm font-medium rounded-xl transition"
          >
            <Calendar className="w-4 h-4" />
            {monthLabel}
          </button>
          <button
            disabled
            title="Segera hadir"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-ink-200 text-ink-300 cursor-not-allowed text-sm font-medium rounded-xl transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium rounded-xl transition shadow-sm ml-1"
          >
            <Plus className="w-4 h-4" />
            Set budget
          </button>
        </div>
      </div>

      {budgets.length > 0 && (
        <>
          {/* Overview Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-800 via-ink-900 to-ink-800 p-6 lg:p-8 text-white">
            <div className="absolute -top-16 -right-16 w-52 h-52 bg-brand-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                  <p className="text-sm text-ink-400 mb-1">Total budget bulan ini</p>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight">{formatIDR(totals.totalSpent)}</h2>
                    <span className="text-sm text-ink-400">/ {formatIDR(totals.totalBudget)}</span>
                  </div>
                  <p className="text-xs text-ink-400 mt-2">
                    Sisa{' '}
                    <span className={totals.remaining >= 0 ? 'text-emerald-300 font-medium' : 'text-rose-300 font-medium'}>
                      {formatIDR(totals.remaining)}
                    </span>{' '}
                    · {totals.minDaysRemaining} hari lagi sampai akhir periode
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-400">Terpakai</p>
                  <p className="text-2xl font-semibold">{totals.pct.toFixed(0)}%</p>
                </div>
              </div>

              <div className="h-3 rounded-full bg-white/10 overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all"
                  style={{ width: `${Math.min(100, totals.pct)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-ink-400">
                <span>0</span>
                <span className="text-emerald-300 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {totals.pct <= 100 ? 'Masih on-track' : 'Sudah melewati total budget'}
                </span>
                <span>{formatIDR(totals.totalBudget)}</span>
              </div>
            </div>
          </div>

          {/* Alert (Over Budget) */}
          {overBudget.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-rose-900">
                  {overBudget.length} kategori sudah melewati budget
                </p>
                <p className="text-xs text-rose-700 mt-0.5">
                  {overBudget.map((b) => b.budget.category?.name).filter(Boolean).join(', ')} sudah melebihi target
                  bulan ini. Pertimbangkan naikkan budget atau kurangi pengeluaran.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((item) => (
          <BudgetCard key={item.budget.id} item={item} />
        ))}

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-ink-50 rounded-2xl border-2 border-dashed border-ink-200 p-5 flex flex-col items-center justify-center text-center min-h-[220px] hover:border-brand-400 hover:bg-brand-50/30 transition cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-ink-100 flex items-center justify-center mb-3">
            <Plus className="w-6 h-6 text-ink-500" />
          </div>
          <p className="font-medium text-ink-700">Tambah budget kategori</p>
          <p className="text-xs text-ink-500 mt-1 max-w-[240px]">Set target pengeluaran biar keuangan lebih terkontrol</p>
        </button>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-br from-brand-50 to-purple-50 rounded-2xl border border-brand-200 p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-base font-semibold">Tips atur budget</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 bg-white/70 rounded-xl backdrop-blur border border-white">
            <p className="text-sm font-medium mb-1">Rumus 50/30/20</p>
            <p className="text-xs text-ink-600">50% kebutuhan, 30% keinginan, 20% tabungan/investasi</p>
          </div>
          <div className="p-4 bg-white/70 rounded-xl backdrop-blur border border-white">
            <p className="text-sm font-medium mb-1">Review tiap minggu</p>
            <p className="text-xs text-ink-600">Cek progress budget setiap Minggu malam biar bisa adjust</p>
          </div>
          <div className="p-4 bg-white/70 rounded-xl backdrop-blur border border-white">
            <p className="text-sm font-medium mb-1">Mulai dari 3 kategori</p>
            <p className="text-xs text-ink-600">Fokus ke Makanan, Transport, Hiburan dulu — bukan semua sekaligus</p>
          </div>
        </div>
      </div>

      {showAddModal && <AddBudgetModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
