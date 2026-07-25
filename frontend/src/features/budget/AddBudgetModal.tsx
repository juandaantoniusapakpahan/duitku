import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useCategories } from '../categories/useCategories';
import CategoryPicker from '../transactions/CategoryPicker';
import { useCreateBudget } from './useBudgets';
import type { BudgetPeriod } from './types';

const PERIOD_LABELS: Record<BudgetPeriod, string> = {
  WEEKLY: 'Mingguan',
  MONTHLY: 'Bulanan',
  YEARLY: 'Tahunan',
};

function parseRupiah(str: string): number {
  const digits = str.replace(/[^0-9]/g, '');
  return digits ? Number(digits) : 0;
}

function formatRupiahInput(str: string): string {
  const n = parseRupiah(str);
  return n ? n.toLocaleString('id-ID') : '';
}

export default function AddBudgetModal({ onClose }: { onClose: () => void }) {
  const { data: categories = [] } = useCategories('EXPENSE');
  const createBudget = useCreateBudget();

  const [categoryId, setCategoryId] = useState<string>();
  const [period, setPeriod] = useState<BudgetPeriod>('MONTHLY');
  const [amountRaw, setAmountRaw] = useState('');

  const amount = parseRupiah(amountRaw);
  const canSubmit = useMemo(() => Boolean(categoryId) && amount > 0, [categoryId, amount]);

  const handleSubmit = () => {
    if (!canSubmit || !categoryId) return;
    createBudget.mutate({ categoryId, period, amount }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div onClick={onClose} className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col animate-slideup">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200 flex-shrink-0">
          <h3 className="text-base font-semibold">Set budget</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-ink-100 flex items-center justify-center">
            <X className="w-5 h-5 text-ink-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div>
            <label className="text-xs text-ink-500 block mb-2">Kategori</label>
            <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
          </div>

          <div>
            <label className="text-xs text-ink-500 block mb-2">Periode</label>
            <div className="grid grid-cols-3 p-1 bg-ink-100 rounded-xl">
              {(Object.keys(PERIOD_LABELS) as BudgetPeriod[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`py-2 text-xs font-medium rounded-lg transition ${
                    period === p ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500'
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-ink-500 block mb-2">Jumlah budget</label>
            <div className="flex items-baseline gap-2 px-4 py-2.5 border border-ink-200 rounded-xl focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500">
              <span className="text-sm text-ink-500">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatRupiahInput(amountRaw)}
                onChange={(e) => setAmountRaw(e.target.value)}
                placeholder="0"
                className="flex-1 border-0 focus:outline-none focus:ring-0 p-0 text-sm bg-transparent"
              />
            </div>
          </div>

          {createBudget.isError && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              Gagal menyimpan budget. Coba lagi.
            </p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-ink-200 flex items-center gap-3 flex-shrink-0 bg-white">
          <button onClick={onClose} className="flex-1 py-2.5 border border-ink-200 hover:bg-ink-100 text-sm font-medium rounded-xl transition">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || createBudget.isPending}
            className="flex-1 py-2.5 bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium rounded-xl transition shadow-sm disabled:opacity-60"
          >
            {createBudget.isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
