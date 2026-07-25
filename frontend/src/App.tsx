import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { refreshAccessToken } from './lib/api';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import DashboardPage from './features/dashboard/DashboardPage';
import AccountsPage from './features/accounts/AccountsPage';
import TransactionsPage from './features/transactions/TransactionsPage';
import BudgetPage from './features/budget/BudgetPage';
import ReportsPage from './features/reports/ReportsPage';
import CategoriesPage from './features/categories/CategoriesPage';
import ProtectedRoute from './routes/ProtectedRoute';
import AppShell from './components/layout/AppShell';

const queryClient = new QueryClient();

function AppRoutes() {
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let cancelled = false;
    refreshAccessToken()
      .catch(() => {
        // No valid refresh cookie yet — user needs to log in.
      })
      .finally(() => {
        if (!cancelled) setBootstrapped(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!bootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-ink-500">Memuat...</div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <DashboardPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounts"
        element={
          <ProtectedRoute>
            <AppShell>
              <AccountsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <AppShell>
              <TransactionsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <AppShell>
              <CategoriesPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/budget"
        element={
          <ProtectedRoute>
            <AppShell>
              <BudgetPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppShell>
              <ReportsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
