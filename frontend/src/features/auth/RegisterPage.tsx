import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Gift, Star, Wallet } from 'lucide-react';
import { useRegister, apiErrorMessage } from './useAuth';
import { getPasswordStrength } from '../../lib/passwordStrength';

const registerSchema = z
  .object({
    fullName: z.string().min(1, 'Nama lengkap wajib diisi'),
    email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
    terms: z.boolean().refine((v) => v === true, { message: 'Kamu harus menyetujui Syarat & Ketentuan' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { terms: false },
  });

  const password = watch('password') ?? '';
  const strength = getPasswordStrength(password);

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(
      { email: values.email, password: values.password, fullName: values.fullName },
      { onSuccess: () => navigate('/dashboard', { replace: true }) },
    );
  };

  return (
    <div className="page min-h-screen grid lg:grid-cols-2">
      {/* Form Side */}
      <div className="flex flex-col p-6 sm:p-10 lg:p-14">
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg">Duitku</span>
        </div>

        <div className="max-w-sm w-full mx-auto flex-1 flex flex-col justify-center py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight mb-2">Buat akun baru</h1>
            <p className="text-sm text-ink-500">Gratis selamanya. Ga perlu kartu kredit.</p>
          </div>

          <button
            type="button"
            disabled
            title="GitHub OAuth belum tersedia di tahap ini"
            className="w-full inline-flex items-center justify-center gap-3 py-2.5 bg-ink-900 text-white rounded-xl text-sm font-medium transition mb-6 opacity-50 cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.82 1.31 3.51 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .32.22.7.83.58C20.57 22.29 24 17.8 24 12.5 24 5.87 18.63.5 12 .5z" />
            </svg>
            Daftar dengan GitHub
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-ink-200" />
            <span className="text-xs text-ink-500">atau isi manual</span>
            <div className="flex-1 h-px bg-ink-200" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="text-sm font-medium block mb-1.5" htmlFor="fullName">Nama lengkap</label>
              <input
                id="fullName"
                type="text"
                placeholder="Raraku"
                className="w-full px-4 py-2.5 border border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none text-sm transition"
                {...register('fullName')}
              />
              {errors.fullName && <p className="text-xs text-rose-600 mt-1.5">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="kamu@email.com"
                className="w-full px-4 py-2.5 border border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none text-sm transition"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-rose-600 mt-1.5">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 8 karakter"
                  className="w-full px-4 py-2.5 pr-10 border border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none text-sm transition"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3].map((bar) => (
                      <div
                        key={bar}
                        className={`flex-1 h-1 rounded-full ${
                          bar < strength.score
                            ? strength.score <= 1
                              ? 'bg-rose-500'
                              : strength.score <= 2
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            : 'bg-ink-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-ink-500 mt-1">
                    {strength.label} · {strength.hint}
                  </p>
                </div>
              )}
              {errors.password && <p className="text-xs text-rose-600 mt-1.5">{errors.password.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" htmlFor="confirmPassword">Konfirmasi password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Ulangi password"
                className="w-full px-4 py-2.5 border border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none text-sm transition"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-rose-600 mt-1.5">{errors.confirmPassword.message}</p>
              )}
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                {...register('terms')}
              />
              <span className="text-xs text-ink-600 leading-relaxed">
                Saya setuju dengan <span className="text-brand-600 hover:underline">Syarat &amp; Ketentuan</span> dan{' '}
                <span className="text-brand-600 hover:underline">Kebijakan Privasi</span>
              </span>
            </label>
            {errors.terms && <p className="text-xs text-rose-600">{errors.terms.message}</p>}

            {registerMutation.isError && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {apiErrorMessage(registerMutation.error, 'Registrasi gagal. Coba lagi.')}
              </p>
            )}

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full py-2.5 bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium rounded-xl transition shadow-sm disabled:opacity-60"
            >
              {registerMutation.isPending ? 'Memproses...' : 'Buat akun'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-6">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">
              Login
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-ink-400 mt-8">
          &copy; 2026 Duitku · <span className="hover:text-ink-600 cursor-pointer">Syarat &amp; Ketentuan</span> ·{' '}
          <span className="hover:text-ink-600 cursor-pointer">Privasi</span>
        </p>
      </div>

      {/* Brand Side */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-14 flex-col justify-between text-white">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/20 backdrop-blur border border-emerald-300/30 text-xs text-emerald-100 mb-8">
            <Gift className="w-3 h-3" />
            100% gratis buat personal use
          </div>

          <h2 className="text-4xl font-semibold tracking-tight leading-tight mb-4">
            Mulai atur uangmu
            <br />
            <span className="text-brand-200">dalam 2 menit</span>
          </h2>
          <p className="text-brand-100 text-base leading-relaxed max-w-md">
            Import transaksi, set budget, catat investasi — semua langsung siap pakai begitu daftar.
          </p>
        </div>

        <div className="relative">
          <div className="p-5 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
            <div className="flex items-center gap-1 mb-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="w-4 h-4 fill-amber-300 text-amber-300" />
              ))}
            </div>
            <p className="text-sm leading-relaxed mb-4">
              "Akhirnya app finance yang ga maksa aku beli premium. Dashboard-nya bersih, tracking investasi juga
              masuk. Recommended."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-medium text-sm">
                DR
              </div>
              <div>
                <p className="text-sm font-medium">Dinda R.</p>
                <p className="text-xs text-brand-200">Product Designer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
