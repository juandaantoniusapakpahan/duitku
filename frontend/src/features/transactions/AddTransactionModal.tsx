import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Calendar, Receipt, X } from 'lucide-react';
import { formatIDR } from '../../lib/currency';
import { useAccounts } from '../accounts/useAccounts';
import { useCategories } from '../categories/useCategories';
import { useCreateTransaction, useUpdateTransaction } from './useTransactions';
import AccountPicker from './AccountPicker';
import CategoryPicker from './CategoryPicker';
import type { CreateTransactionPayload, Transaction, TransactionType, UpdateTransactionPayload } from './types';

const TYPE_TABS: { value: TransactionType; label: string; icon: typeof ArrowDownLeft }[] = [
  { value: 'INCOME', label: 'Pemasukan', icon: ArrowDownLeft },
  { value: 'EXPENSE', label: 'Pengeluaran', icon: ArrowUpRight },
  { value: 'TRANSFER', label: 'Transfer', icon: ArrowRight },
];

function parseRupiah(str: string): number {
  const digits = str.replace(/[^0-9]/g, '');
  return digits ? Number(digits) : 0;
}

function formatRupiahInput(str: string): string {
  const n = parseRupiah(str);
  return n ? n.toLocaleString('id-ID') : '';
}

// `new Date("yyyy-MM-dd")` is parsed as UTC midnight per the ECMA spec, which lands on
// 07:00 in WIB — combine the picked date with a time-of-day instead (current time for new
// transactions, the original time when editing) so the timestamp stays sensible.
function toOccurredAtIso(dateStr: string, referenceIso?: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const ref = referenceIso ? new Date(referenceIso) : new Date();
  return new Date(year, month - 1, day, ref.getHours(), ref.getMinutes(), ref.getSeconds()).toISOString();
}

export default function AddTransactionModal({
  transaction,
  onClose,
}: {
  transaction?: Transaction;
  onClose: () => void;
}) {
  const isEdit = Boolean(transaction);
  const { data: accounts = [] } = useAccounts();
  const { data: expenseCategories = [] } = useCategories('EXPENSE');
  const { data: incomeCategories = [] } = useCategories('INCOME');
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'EXPENSE');
  const [amountRaw, setAmountRaw] = useState(transaction ? String(transaction.amount) : '');
  const [accountId, setAccountId] = useState<string | undefined>(transaction?.account?.id);
  const [fromAccountId, setFromAccountId] = useState<string | undefined>(transaction?.from_account?.id);
  const [toAccountId, setToAccountId] = useState<string | undefined>(transaction?.to_account?.id);
  const [categoryId, setCategoryId] = useState<string | undefined>(transaction?.category?.id);
  const [feeEnabled, setFeeEnabled] = useState(false);
  const [feeAmountRaw, setFeeAmountRaw] = useState('');
  const [feeCategoryId, setFeeCategoryId] = useState<string>();
  const [occurredAtStr, setOccurredAtStr] = useState(
    format(transaction ? new Date(transaction.occurred_at) : new Date(), 'yyyy-MM-dd'),
  );
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [notes, setNotes] = useState(transaction?.notes ?? '');

  const activeCategories = type === 'INCOME' ? incomeCategories : expenseCategories;
  const amount = parseRupiah(amountRaw);
  const feeAmount = feeEnabled ? parseRupiah(feeAmountRaw) : 0;
  const isTransferLocked = isEdit && type === 'TRANSFER';

  const canSubmit = useMemo(() => {
    if (isTransferLocked) return true;
    if (amount <= 0) return false;
    if (type === 'TRANSFER') {
      if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) return false;
      if (feeEnabled && (feeAmount <= 0 || !feeCategoryId)) return false;
      return true;
    }
    return Boolean(accountId);
  }, [isTransferLocked, amount, type, fromAccountId, toAccountId, feeEnabled, feeAmount, feeCategoryId, accountId]);

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);
  const singleAccount = accounts.find((a) => a.id === accountId);

  const handleSubmit = () => {
    if (!canSubmit) return;

    if (isEdit && transaction) {
      const payload: UpdateTransactionPayload = {
        description: description || undefined,
        notes: notes || undefined,
        occurredAt: toOccurredAtIso(occurredAtStr, transaction.occurred_at),
      };
      if (!isTransferLocked) {
        payload.amount = amount;
        payload.accountId = accountId;
        payload.categoryId = categoryId;
      }
      updateTransaction.mutate({ id: transaction.id, payload }, { onSuccess: onClose });
      return;
    }

    const payload: CreateTransactionPayload = {
      type,
      amount,
      occurredAt: toOccurredAtIso(occurredAtStr),
      description: description || undefined,
      notes: notes || undefined,
    };
    if (type === 'TRANSFER') {
      payload.fromAccountId = fromAccountId;
      payload.toAccountId = toAccountId;
      if (feeEnabled && feeAmount > 0) {
        payload.fee = feeAmount;
        payload.feeCategoryId = feeCategoryId;
      }
    } else {
      payload.accountId = accountId;
      payload.categoryId = categoryId;
    }
    createTransaction.mutate(payload, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div onClick={onClose} className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col animate-slideup">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200 flex-shrink-0">
          <h3 className="text-base font-semibold">{isEdit ? 'Edit transaksi' : 'Tambah transaksi'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-ink-100 flex items-center justify-center">
            <X className="w-5 h-5 text-ink-500" />
          </button>
        </div>

        <div className="px-5 pt-4 flex-shrink-0">
          <div className="grid grid-cols-3 p-1 bg-ink-100 rounded-xl">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                disabled={isEdit}
                onClick={() => setType(tab.value)}
                className={`py-2 text-xs font-medium rounded-lg transition flex items-center justify-center gap-1 ${
                  type === tab.value ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500'
                } ${isEdit ? 'cursor-not-allowed opacity-70' : ''}`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div>
            <label className="text-xs text-ink-500 block mb-1.5">Deskripsi</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="cth. Makan siang, Gaji Juli"
              className="w-full px-3 py-2.5 text-sm border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-ink-500 block mb-2">Jumlah</label>
            <div className="flex items-baseline gap-2">
              <span className="text-lg text-ink-500">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                readOnly={isTransferLocked}
                value={formatRupiahInput(amountRaw)}
                onChange={(e) => setAmountRaw(e.target.value)}
                placeholder="0"
                className={`text-3xl font-semibold flex-1 border-0 focus:outline-none focus:ring-0 p-0 bg-transparent ${
                  isTransferLocked ? 'text-ink-400 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <div className="h-px bg-ink-200 mt-2" />
          </div>

          {isTransferLocked && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Jumlah dan akun transfer tidak bisa diubah. Hapus transaksi ini lalu buat ulang kalau salah.
            </p>
          )}

          {type === 'TRANSFER' ? (
            <div className={`grid grid-cols-[1fr_auto_1fr] gap-3 items-end ${isTransferLocked ? 'pointer-events-none opacity-60' : ''}`}>
              <div>
                <label className="text-xs text-ink-500 block mb-2">Dari akun</label>
                <AccountPicker accounts={accounts} value={fromAccountId} onChange={setFromAccountId} />
              </div>
              <div className="pb-3.5 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-brand-600" />
                </div>
              </div>
              <div>
                <label className="text-xs text-ink-500 block mb-2">Ke akun</label>
                <AccountPicker accounts={accounts} value={toAccountId} onChange={setToAccountId} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink-500 block mb-2">Akun</label>
                <AccountPicker accounts={accounts} value={accountId} onChange={setAccountId} />
              </div>
              <div>
                <label className="text-xs text-ink-500 block mb-2">Kategori</label>
                <CategoryPicker categories={activeCategories} value={categoryId} onChange={setCategoryId} />
              </div>
            </div>
          )}

          {type === 'TRANSFER' && !isEdit && (
            <div className="p-4 border border-ink-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Ada biaya admin?</p>
                    <p className="text-[11px] text-ink-500">Fee akan dicatat sebagai expense terpisah</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFeeEnabled((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition flex-shrink-0 ${feeEnabled ? 'bg-brand-600' : 'bg-ink-300'}`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition ${
                      feeEnabled ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {feeEnabled && (
                <div className="mt-4 pt-4 border-t border-ink-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-ink-500 block mb-1.5">Jumlah fee</label>
                      <div className="flex items-center gap-1 border border-ink-200 rounded-lg px-3 py-2">
                        <span className="text-xs text-ink-500">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatRupiahInput(feeAmountRaw)}
                          onChange={(e) => setFeeAmountRaw(e.target.value)}
                          placeholder="0"
                          className="text-sm font-medium flex-1 border-0 focus:outline-none focus:ring-0 p-0 bg-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-ink-500 block mb-1.5">Kategori fee</label>
                      <CategoryPicker categories={expenseCategories} value={feeCategoryId} onChange={setFeeCategoryId} placeholder="Pilih" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Date + Note */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink-500 block mb-1.5">Tanggal</label>
              <div className="flex items-center gap-2 px-3 py-2.5 border border-ink-200 rounded-lg">
                <Calendar className="w-4 h-4 text-ink-500 flex-shrink-0" />
                <input
                  type="date"
                  value={occurredAtStr}
                  onChange={(e) => setOccurredAtStr(e.target.value)}
                  className="text-sm border-0 focus:outline-none focus:ring-0 p-0 bg-transparent w-full"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-ink-500 block mb-1.5">Catatan</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opsional..."
                className="w-full px-3 py-2.5 text-sm border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-xl bg-ink-50 border border-ink-200">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500 mb-3">Preview perubahan</p>
            <div className="space-y-2 text-sm">
              {type === 'TRANSFER' ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>{fromAccount?.name ?? 'Dari akun'}</span>
                    </div>
                    <span className="font-medium text-rose-600">- {formatIDR(amount + feeAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{toAccount?.name ?? 'Ke akun'}</span>
                    </div>
                    <span className="font-medium text-emerald-600">+ {formatIDR(amount)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-ink-200">
                    <span className="text-xs text-ink-500">Efek ke kekayaan bersih</span>
                    <span className={`text-xs font-semibold ${feeAmount > 0 ? 'text-rose-600' : 'text-ink-500'}`}>
                      {feeAmount > 0 ? `- ${formatIDR(feeAmount)}` : 'Rp 0 (netral)'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${type === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>{singleAccount?.name ?? 'Akun'}</span>
                    </div>
                    <span className={`font-medium ${type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {type === 'INCOME' ? '+' : '-'} {formatIDR(amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-ink-200">
                    <span className="text-xs text-ink-500">Efek ke kekayaan bersih</span>
                    <span className={`text-xs font-semibold ${type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {type === 'INCOME' ? '+' : '-'} {formatIDR(amount)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {(createTransaction.isError || updateTransaction.isError) && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              Gagal menyimpan transaksi. Coba lagi.
            </p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-ink-200 flex items-center gap-3 flex-shrink-0 bg-white">
          <button onClick={onClose} className="flex-1 py-2.5 border border-ink-200 hover:bg-ink-100 text-sm font-medium rounded-xl transition">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || createTransaction.isPending || updateTransaction.isPending}
            className="flex-1 py-2.5 bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium rounded-xl transition shadow-sm disabled:opacity-60"
          >
            {createTransaction.isPending || updateTransaction.isPending
              ? 'Menyimpan...'
              : isEdit
                ? 'Simpan perubahan'
                : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
