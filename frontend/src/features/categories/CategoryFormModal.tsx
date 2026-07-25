import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { COLOR_NAMES, ICON_NAMES, getColorClasses, getIcon } from '../../lib/icons';
import { useCreateCategory, useUpdateCategory } from './useCategories';
import type { Category, CategoryKind } from './types';

const KIND_LABELS: Record<CategoryKind, string> = {
  EXPENSE: 'Pengeluaran',
  INCOME: 'Pemasukan',
};

export default function CategoryFormModal({
  category,
  defaultKind,
  onClose,
}: {
  category?: Category;
  defaultKind: CategoryKind;
  onClose: () => void;
}) {
  const isEdit = Boolean(category);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [name, setName] = useState(category?.name ?? '');
  const [kind, setKind] = useState<CategoryKind>(category?.kind ?? defaultKind);
  const [icon, setIcon] = useState(category?.icon ?? ICON_NAMES[0]);
  const [color, setColor] = useState(category?.color ?? COLOR_NAMES[0]);

  const isPending = createCategory.isPending || updateCategory.isPending;
  const isError = createCategory.isError || updateCategory.isError;
  const canSubmit = useMemo(() => name.trim().length > 0, [name]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (isEdit && category) {
      updateCategory.mutate({ id: category.id, payload: { name, icon, color } }, { onSuccess: onClose });
    } else {
      createCategory.mutate({ name, kind, icon, color }, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div onClick={onClose} className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col animate-slideup">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200 flex-shrink-0">
          <h3 className="text-base font-semibold">{isEdit ? 'Edit kategori' : 'Tambah kategori'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-ink-100 flex items-center justify-center">
            <X className="w-5 h-5 text-ink-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-50 border border-ink-200">
            <div className={`w-10 h-10 rounded-xl ${getColorClasses(color).bg} flex items-center justify-center`}>
              {(() => {
                const Icon = getIcon(icon);
                return <Icon className={`w-5 h-5 ${getColorClasses(color).text}`} />;
              })()}
            </div>
            <div>
              <p className="text-sm font-medium">{name || 'Nama kategori'}</p>
              <p className="text-xs text-ink-500">{KIND_LABELS[kind]}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5" htmlFor="category-name">
              Nama kategori
            </label>
            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth. Langganan, Hobi"
              className="w-full px-4 py-2.5 border border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none text-sm transition"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="text-xs text-ink-500 block mb-2">Tipe</label>
              <div className="grid grid-cols-2 p-1 bg-ink-100 rounded-xl">
                {(Object.keys(KIND_LABELS) as CategoryKind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`py-2 text-xs font-medium rounded-lg text-center transition ${
                      kind === k ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-400 hover:text-ink-600'
                    }`}
                  >
                    {KIND_LABELS[k]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-ink-500 block mb-2">Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_NAMES.map((iconName) => {
                const Icon = getIcon(iconName);
                const active = icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`aspect-square rounded-lg flex items-center justify-center border transition ${
                      active ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:bg-ink-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-brand-600' : 'text-ink-500'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs text-ink-500 block mb-2">Warna</label>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_NAMES.map((colorName) => {
                const active = color === colorName;
                return (
                  <button
                    key={colorName}
                    type="button"
                    onClick={() => setColor(colorName)}
                    aria-label={colorName}
                    className={`aspect-square rounded-lg ${getColorClasses(colorName).solid} flex items-center justify-center transition ${
                      active ? 'ring-2 ring-offset-2 ring-brand-500' : ''
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {isError && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              Gagal menyimpan kategori. Coba lagi.
            </p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-ink-200 flex items-center gap-3 flex-shrink-0 bg-white">
          <button onClick={onClose} className="flex-1 py-2.5 border border-ink-200 hover:bg-ink-100 text-sm font-medium rounded-xl transition">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
            className="flex-1 py-2.5 bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium rounded-xl transition shadow-sm disabled:opacity-60"
          >
            {isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
