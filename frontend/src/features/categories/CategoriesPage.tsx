import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useCategories } from './useCategories';
import CategoryCard from './CategoryCard';
import CategoryFormModal from './CategoryFormModal';
import type { Category, CategoryKind } from './types';

const FILTERS: { value: CategoryKind | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Semua' },
  { value: 'EXPENSE', label: 'Pengeluaran' },
  { value: 'INCOME', label: 'Pemasukan' },
];

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const [filter, setFilter] = useState<CategoryKind | 'ALL'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const filtered = useMemo(
    () => (filter === 'ALL' ? categories : categories.filter((c) => c.kind === filter)),
    [categories, filter],
  );

  const expenseCount = categories.filter((c) => c.kind === 'EXPENSE').length;
  const incomeCount = categories.filter((c) => c.kind === 'INCOME').length;

  if (isLoading) {
    return (
      <div className="page max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-8">
        <p className="text-sm text-ink-500">Memuat kategori...</p>
      </div>
    );
  }

  return (
    <div className="page max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">Kategori</h1>
          <p className="text-sm text-ink-500 mt-1">
            {categories.length} kategori · {expenseCount} pengeluaran · {incomeCount} pemasukan
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah kategori
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => {
          const count = f.value === 'ALL' ? categories.length : categories.filter((c) => c.kind === f.value).length;
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                active ? 'bg-ink-900 text-white' : 'hover:bg-ink-100 text-ink-600'
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Category Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-ink-200 p-10 text-center">
          <p className="text-sm font-medium mb-1">Belum ada kategori di sini.</p>
          <p className="text-sm text-ink-500 mb-4">Tambah kategori baru buat mulai kelompokkan transaksi kamu.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah kategori
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((category) => (
            <CategoryCard key={category.id} category={category} onEdit={() => setEditingCategory(category)} />
          ))}
        </div>
      )}

      {showAddModal && (
        <CategoryFormModal defaultKind={filter === 'INCOME' ? 'INCOME' : 'EXPENSE'} onClose={() => setShowAddModal(false)} />
      )}
      {editingCategory && (
        <CategoryFormModal
          category={editingCategory}
          defaultKind={editingCategory.kind}
          onClose={() => setEditingCategory(null)}
        />
      )}
    </div>
  );
}
