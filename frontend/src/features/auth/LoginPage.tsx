import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChartLine, Eye, EyeOff, ShieldCheck, Target, Wallet } from 'lucide-react';
import { useLogin, apiErrorMessage } from './useAuth';

const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: true },
  });

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(
      { email: values.email, password: values.password },
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
            <h1 className="text-3xl font-semibold tracking-tight mb-2">Selamat datang kembali</h1>
            <p className="text-sm text-ink-500">Login ke akun Duitku kamu untuk lanjut kelola keuangan</p>
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
            Lanjutkan dengan GitHub
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-ink-200" />
            <span className="text-xs text-ink-500">atau</span>
            <div className="flex-1 h-px bg-ink-200" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" htmlFor="password">Password</label>
                <span className="text-xs text-brand-600 hover:text-brand-700 font-medium cursor-not-allowed" title="Belum tersedia di tahap ini">
                  Lupa password?
                </span>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
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
              {errors.password && <p className="text-xs text-rose-600 mt-1.5">{errors.password.message}</p>}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                {...register('remember')}
              />
              <span className="text-sm text-ink-600">Ingat saya 30 hari</span>
            </label>

            {login.isError && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {apiErrorMessage(login.error, 'Login gagal. Coba lagi.')}
              </p>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full py-2.5 bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium rounded-xl transition shadow-sm disabled:opacity-60"
            >
              {login.isPending ? 'Memproses...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-6">
            Belum punya akun?{' '}
            <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium">
              Daftar sekarang
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Beta v1.0 — free selamanya buat personal use
          </div>

          <h2 className="text-4xl font-semibold tracking-tight leading-tight mb-4">
            Kelola keuangan pribadi
            <br />
            <span className="text-brand-200">yang beneran kepakai</span>
          </h2>
          <p className="text-brand-100 text-base leading-relaxed max-w-md">
            Tracking pengeluaran, budget, investasi, sampai fee bank — semua di satu tempat, tanpa ribet.
          </p>
        </div>

        <div className="relative space-y-3">
          <div className="p-4 bg-white/10 backdrop-blur rounded-xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <ChartLine className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Dashboard cerdas</p>
              <p className="text-xs text-brand-200">Tau kondisi keuangan dalam 3 detik</p>
            </div>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur rounded-xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Budget per kategori</p>
              <p className="text-xs text-brand-200">Set target, tracking otomatis, alert kalau over</p>
            </div>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur rounded-xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Data 100% milik kamu</p>
              <p className="text-xs text-brand-200">Ga ada iklan, ga jualan data, ga judgy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
