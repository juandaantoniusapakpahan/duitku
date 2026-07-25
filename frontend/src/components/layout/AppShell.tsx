import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeftRight,
  Bell,
  ChartLine,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Search,
  Shapes,
  Target,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth';
import { useLogout } from '../../features/auth/useAuth';

const activeClass = 'bg-brand-50 text-brand-700';
const inactiveClass = 'text-ink-500 hover:bg-ink-100';
const navItemBase = 'nav-item w-full flex items-center gap-3 px-2.5 lg:px-3 py-2.5 rounded-lg text-sm font-medium';

function DisabledNavItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      disabled
      title="Segera hadir"
      className={`${navItemBase} text-ink-300 cursor-not-allowed`}
    >
      {icon}
      <span className="hidden lg:block">{label}</span>
    </button>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const logout = useLogout();
  const initials = (user?.full_name ?? '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => navigate('/login', { replace: true }) });
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (Desktop/Tablet) */}
      <aside className="hidden md:flex md:w-16 lg:w-60 flex-col border-r border-ink-200 bg-white sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 px-4 lg:px-5 h-16 border-b border-ink-200">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="hidden lg:block font-semibold text-[15px] tracking-tight">Duitku</span>
        </div>

        <nav className="flex-1 px-2 lg:px-3 py-4 space-y-0.5">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `${navItemBase} ${isActive ? activeClass : inactiveClass}`}
          >
            <LayoutDashboard className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="hidden lg:block">Dashboard</span>
          </NavLink>
          <NavLink
            to="/transactions"
            className={({ isActive }) => `${navItemBase} ${isActive ? activeClass : inactiveClass}`}
          >
            <ArrowLeftRight className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="hidden lg:block">Transaksi</span>
          </NavLink>
          <NavLink
            to="/accounts"
            className={({ isActive }) => `${navItemBase} ${isActive ? activeClass : inactiveClass}`}
          >
            <CreditCard className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="hidden lg:block">Akun</span>
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) => `${navItemBase} ${isActive ? activeClass : inactiveClass}`}
          >
            <Shapes className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="hidden lg:block">Kategori</span>
          </NavLink>
          <NavLink
            to="/budget"
            className={({ isActive }) => `${navItemBase} ${isActive ? activeClass : inactiveClass}`}
          >
            <Target className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="hidden lg:block">Budget</span>
          </NavLink>
          <NavLink
            to="/reports"
            className={({ isActive }) => `${navItemBase} ${isActive ? activeClass : inactiveClass}`}
          >
            <ChartLine className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="hidden lg:block">Laporan</span>
          </NavLink>

          <div className="pt-4 mt-4 border-t border-ink-200">
            <p className="hidden lg:block px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-ink-400">
              Modul
            </p>
            <DisabledNavItem icon={<Activity className="w-[18px] h-[18px] flex-shrink-0" />} label="Activity Tracker" />
            <DisabledNavItem icon={<Plus className="w-[18px] h-[18px] flex-shrink-0" />} label="Tambah modul" />
          </div>
        </nav>

        <div className="p-3 border-t border-ink-200">
          <button
            type="button"
            onClick={handleLogout}
            className="hidden lg:flex w-full items-center gap-3 p-2 rounded-lg hover:bg-ink-100 cursor-pointer text-left"
            title="Logout"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-semibold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name ?? ''}</p>
              <p className="text-xs text-ink-500 truncate">{user?.email ?? ''}</p>
            </div>
            <LogOut className="w-4 h-4 text-ink-400" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="lg:hidden flex w-full justify-center cursor-pointer"
            title="Logout"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-semibold">
              {initials}
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Bar (Mobile) */}
        <header className="md:hidden sticky top-0 z-30 glass border-b border-ink-200">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-[15px]">Duitku</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-9 h-9 rounded-full hover:bg-ink-100 flex items-center justify-center relative">
                <Bell className="w-[18px] h-[18px] text-ink-600" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-semibold">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Top Bar (Desktop) */}
        <header className="hidden md:flex sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-ink-200 items-center justify-between px-6 lg:px-8 h-16">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari transaksi, kategori..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-ink-100 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-lg hover:bg-ink-100 flex items-center justify-center">
              <Moon className="w-[18px] h-[18px] text-ink-600" />
            </button>
            <button className="w-9 h-9 rounded-lg hover:bg-ink-100 flex items-center justify-center relative">
              <Bell className="w-[18px] h-[18px] text-ink-600" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass border-t border-ink-200">
        <div className="grid grid-cols-5 items-center h-16 px-2">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `flex flex-col items-center gap-1 py-2 rounded-lg ${isActive ? 'text-brand-600' : 'text-ink-400'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </NavLink>
          <NavLink
            to="/transactions"
            className={({ isActive }) => `flex flex-col items-center gap-1 py-2 rounded-lg ${isActive ? 'text-brand-600' : 'text-ink-400'}`}
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span className="text-[10px] font-medium">Transaksi</span>
          </NavLink>
          <button type="button" onClick={() => navigate('/transactions')} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30 -mt-4">
              <Plus className="w-5 h-5 text-white" />
            </div>
          </button>
          <NavLink
            to="/budget"
            className={({ isActive }) => `flex flex-col items-center gap-1 py-2 rounded-lg ${isActive ? 'text-brand-600' : 'text-ink-400'}`}
          >
            <Target className="w-5 h-5" />
            <span className="text-[10px] font-medium">Budget</span>
          </NavLink>
          <NavLink
            to="/accounts"
            className={({ isActive }) => `flex flex-col items-center gap-1 py-2 rounded-lg ${isActive ? 'text-brand-600' : 'text-ink-400'}`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] font-medium">Akun</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
