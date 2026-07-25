import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatIDRCompact } from '../../lib/currency';
import { getColorClasses, getIcon } from '../../lib/icons';
import type { Account } from '../accounts/types';

export default function AccountPicker({
  accounts,
  value,
  onChange,
  placeholder = 'Pilih akun',
}: {
  accounts: Account[];
  value: string | undefined;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = accounts.find((a) => a.id === value);
  const Icon = selected ? getIcon(selected.icon) : null;
  const colors = selected ? getColorClasses(selected.color) : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 p-3 border border-ink-200 rounded-xl hover:bg-ink-50 transition text-left"
      >
        {selected && Icon && colors ? (
          <>
            <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${colors.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selected.name}</p>
              <p className="text-[11px] text-ink-500">{formatIDRCompact(selected.current_balance)}</p>
            </div>
          </>
        ) : (
          <span className="text-sm text-ink-400 flex-1">{placeholder}</span>
        )}
        <ChevronDown className="w-4 h-4 text-ink-400 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-ink-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {accounts.map((account) => {
            const AccIcon = getIcon(account.icon);
            const accColors = getColorClasses(account.color);
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => {
                  onChange(account.id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 p-3 hover:bg-ink-50 transition text-left"
              >
                <div className={`w-8 h-8 rounded-lg ${accColors.bg} flex items-center justify-center flex-shrink-0`}>
                  <AccIcon className={`w-4 h-4 ${accColors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{account.name}</p>
                  <p className="text-[11px] text-ink-500">{formatIDRCompact(account.current_balance)}</p>
                </div>
              </button>
            );
          })}
          {accounts.length === 0 && <p className="p-3 text-xs text-ink-500">Belum ada akun.</p>}
        </div>
      )}
    </div>
  );
}
