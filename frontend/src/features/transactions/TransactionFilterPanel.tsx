import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useAccounts } from '../accounts/useAccounts';
import { useCategories } from '../categories/useCategories';
import { getColorClasses, getIcon } from '../../lib/icons';

export default function TransactionFilterPanel({
  accountId,
  categoryId,
  onChangeAccount,
  onChangeCategory,
  onReset,
  onClose,
}: {
  accountId: string | undefined;
  categoryId: string | undefined;
  onChangeAccount: (id: string | undefined) => void;
  onChangeCategory: (id: string | undefined) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const hasActiveFilter = Boolean(accountId || categoryId);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 z-20 w-72 bg-white border border-ink-200 rounded-2xl shadow-lg p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Filter</p>
        <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-ink-100 flex items-center justify-center">
          <X className="w-3.5 h-3.5 text-ink-500" />
        </button>
      </div>

      <div>
        <p className="text-xs text-ink-500 mb-2">Akun</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onChangeAccount(undefined)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition ${
              !accountId ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            }`}
          >
            Semua akun
          </button>
          {accounts.map((account) => {
            const Icon = getIcon(account.icon);
            const colors = getColorClasses(account.color);
            const active = accountId === account.id;
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => onChangeAccount(active ? undefined : account.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition ${
                  active ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                <Icon className={`w-3 h-3 ${active ? 'text-white' : colors.text}`} />
                {account.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs text-ink-500 mb-2">Kategori</p>
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          <button
            type="button"
            onClick={() => onChangeCategory(undefined)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition ${
              !categoryId ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            }`}
          >
            Semua kategori
          </button>
          {categories.map((category) => {
            const Icon = getIcon(category.icon);
            const colors = getColorClasses(category.color);
            const active = categoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onChangeCategory(active ? undefined : category.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition ${
                  active ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                <Icon className={`w-3 h-3 ${active ? 'text-white' : colors.text}`} />
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      {hasActiveFilter && (
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2 text-xs font-medium text-ink-600 hover:bg-ink-100 rounded-lg transition"
        >
          Reset filter
        </button>
      )}
    </div>
  );
}
