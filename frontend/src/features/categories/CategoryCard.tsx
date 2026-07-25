import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { getColorClasses, getIcon } from '../../lib/icons';
import { useDeleteCategory } from './useCategories';
import type { Category } from './types';

export default function CategoryCard({ category, onEdit }: { category: Category; onEdit: () => void }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deleteCategory = useDeleteCategory();
  const Icon = getIcon(category.icon);
  const colors = getColorClasses(category.color);

  return (
    <div className="bg-white rounded-2xl border border-ink-200 p-4 card-hover flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${colors.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">{category.name}</p>
          {category.is_default && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-100 text-ink-500 font-medium flex-shrink-0">
              Bawaan
            </span>
          )}
        </div>
        <p className="text-xs text-ink-500">{category.kind === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}</p>
      </div>

      {confirmingDelete ? (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setConfirmingDelete(false)}
            className="px-2.5 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-100 rounded-lg transition"
          >
            Batal
          </button>
          <button
            onClick={() => deleteCategory.mutate(category.id)}
            disabled={deleteCategory.isPending}
            className="px-2.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition disabled:opacity-60"
          >
            {deleteCategory.isPending ? '...' : 'Hapus?'}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-lg hover:bg-ink-100 flex items-center justify-center text-ink-500"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setConfirmingDelete(true)}
            disabled={category.is_default}
            title={category.is_default ? 'Kategori bawaan tidak bisa dihapus' : 'Hapus'}
            className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-ink-500 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
