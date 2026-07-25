import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getColorClasses, getIcon } from '../../lib/icons';
import type { Category } from '../categories/types';

export default function CategoryPicker({
  categories,
  value,
  onChange,
  placeholder = 'Pilih kategori',
}: {
  categories: Category[];
  value: string | undefined;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = categories.find((c) => c.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 border border-ink-200 rounded-lg hover:bg-ink-50 transition text-left"
      >
        <span className="text-sm flex-1 truncate">{selected ? selected.name : placeholder}</span>
        <ChevronDown className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-ink-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {categories.map((category) => {
            const CatIcon = getIcon(category.icon);
            const colors = getColorClasses(category.color);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  onChange(category.id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-ink-50 transition text-left"
              >
                <div className={`w-6 h-6 rounded ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                  <CatIcon className={`w-3.5 h-3.5 ${colors.text}`} />
                </div>
                <span className="text-sm truncate">{category.name}</span>
              </button>
            );
          })}
          {categories.length === 0 && <p className="p-3 text-xs text-ink-500">Belum ada kategori.</p>}
        </div>
      )}
    </div>
  );
}
