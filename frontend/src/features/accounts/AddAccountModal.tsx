import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { getIcon } from '../../lib/icons';
import { useCreateAccount } from './useAccounts';
import { ACCOUNT_TYPE_META, ACCOUNT_TYPE_ORDER } from './constants';

const ACCOUNT_TYPES = ACCOUNT_TYPE_ORDER.map((value) => ({ value, ...ACCOUNT_TYPE_META[value] }));

const schema = z.object({
  name: z.string().min(1, 'Nama akun wajib diisi'),
  type: z.enum(['BANK', 'EWALLET', 'CASH', 'INVESTMENT']),
  currentBalance: z.string().optional(),
  costBasis: z.string().optional(),
  currentValue: z.string().optional(),
  accountNumberMasked: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const digits = value.replace(/[^0-9]/g, '');
  return digits ? Number(digits) : undefined;
}

export default function AddAccountModal({ onClose }: { onClose: () => void }) {
  const createAccount = useCreateAccount();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { type: 'BANK' } });

  const selectedType = watch('type');
  const isInvestment = selectedType === 'INVESTMENT';
  const showAccountNumber = selectedType === 'BANK' || selectedType === 'EWALLET';

  const onSubmit = (values: FormValues) => {
    const meta = ACCOUNT_TYPES.find((t) => t.value === values.type)!;
    createAccount.mutate(
      {
        name: values.name,
        type: values.type,
        icon: meta.icon,
        color: meta.color,
        currentBalance: isInvestment ? toNumber(values.currentValue) : toNumber(values.currentBalance),
        costBasis: isInvestment ? toNumber(values.costBasis) : undefined,
        currentValue: isInvestment ? toNumber(values.currentValue) : undefined,
        accountNumberMasked: values.accountNumberMasked || undefined,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div onClick={onClose} className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col animate-slideup">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200 flex-shrink-0">
          <h3 className="text-base font-semibold">Tambah akun</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-ink-100 flex items-center justify-center">
            <X className="w-5 h-5 text-ink-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-5 py-5 space-y-5" noValidate>
          <div>
            <label className="text-xs text-ink-500 block mb-2">Tipe akun</label>
            <div className="grid grid-cols-4 gap-2">
              {ACCOUNT_TYPES.map((t) => {
                const Icon = getIcon(t.icon);
                const active = selectedType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setValue('type', t.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition ${
                      active ? 'border-brand-500 bg-brand-50/50' : 'border-ink-200 hover:bg-ink-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-brand-600' : 'text-ink-500'}`} />
                    <span className={`text-[11px] font-medium ${active ? 'text-brand-700' : 'text-ink-600'}`}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5" htmlFor="name">Nama akun</label>
            <input
              id="name"
              type="text"
              placeholder="cth. BCA, GoPay, Dompet"
              className="w-full px-4 py-2.5 border border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none text-sm transition"
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-rose-600 mt-1.5">{errors.name.message}</p>}
          </div>

          {showAccountNumber && (
            <div>
              <label className="text-sm font-medium block mb-1.5" htmlFor="accountNumberMasked">
                Nomor rekening (opsional)
              </label>
              <input
                id="accountNumberMasked"
                type="text"
                placeholder="6789****4321"
                className="w-full px-4 py-2.5 border border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none text-sm transition"
                {...register('accountNumberMasked')}
              />
            </div>
          )}

          {!isInvestment && (
            <div>
              <label className="text-sm font-medium block mb-1.5" htmlFor="currentBalance">Saldo awal</label>
              <div className="flex items-baseline gap-2 px-4 py-2.5 border border-ink-200 rounded-xl focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500">
                <span className="text-sm text-ink-500">Rp</span>
                <input
                  id="currentBalance"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  className="flex-1 border-0 focus:outline-none focus:ring-0 p-0 text-sm bg-transparent"
                  {...register('currentBalance')}
                />
              </div>
            </div>
          )}

          {isInvestment && (
            <>
              <div>
                <label className="text-sm font-medium block mb-1.5" htmlFor="costBasis">Modal awal</label>
                <div className="flex items-baseline gap-2 px-4 py-2.5 border border-ink-200 rounded-xl focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500">
                  <span className="text-sm text-ink-500">Rp</span>
                  <input
                    id="costBasis"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    className="flex-1 border-0 focus:outline-none focus:ring-0 p-0 text-sm bg-transparent"
                    {...register('costBasis')}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" htmlFor="currentValue">Nilai saat ini</label>
                <div className="flex items-baseline gap-2 px-4 py-2.5 border border-ink-200 rounded-xl focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500">
                  <span className="text-sm text-ink-500">Rp</span>
                  <input
                    id="currentValue"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    className="flex-1 border-0 focus:outline-none focus:ring-0 p-0 text-sm bg-transparent"
                    {...register('currentValue')}
                  />
                </div>
              </div>
            </>
          )}

          {createAccount.isError && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              Gagal menambah akun. Coba lagi.
            </p>
          )}
        </form>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-ink-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-ink-200 hover:bg-ink-100 text-sm font-medium rounded-xl transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={createAccount.isPending}
            className="flex-1 py-2.5 bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium rounded-xl transition shadow-sm disabled:opacity-60"
          >
            {createAccount.isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
