import { useEffect, useRef, useState } from 'react';
import { endOfMonth, format, startOfMonth, subDays, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar } from 'lucide-react';

export interface DateRange {
  from?: string;
  to?: string;
}

function toDateInputValue(iso: string | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function startOfDayIso(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toISOString();
}

function endOfDayIso(dateStr: string): string {
  return new Date(`${dateStr}T23:59:59.999`).toISOString();
}

const PRESETS: { label: string; range: () => DateRange }[] = [
  {
    label: 'Bulan ini',
    range: () => {
      const now = new Date();
      return { from: startOfMonth(now).toISOString(), to: now.toISOString() };
    },
  },
  {
    label: 'Bulan lalu',
    range: () => {
      const prev = subMonths(new Date(), 1);
      return { from: startOfMonth(prev).toISOString(), to: endOfMonth(prev).toISOString() };
    },
  },
  {
    label: '7 hari terakhir',
    range: () => {
      const now = new Date();
      return { from: subDays(now, 6).toISOString(), to: now.toISOString() };
    },
  },
  {
    label: '30 hari terakhir',
    range: () => {
      const now = new Date();
      return { from: subDays(now, 29).toISOString(), to: now.toISOString() };
    },
  },
  { label: 'Semua waktu', range: () => ({ from: undefined, to: undefined }) },
];

export function dateRangeLabel(range: DateRange): string {
  if (!range.from && !range.to) return 'Semua waktu';
  const fromLabel = range.from ? format(new Date(range.from), 'd MMM', { locale: id }) : '...';
  const toLabel = range.to ? format(new Date(range.to), 'd MMM yyyy', { locale: id }) : '...';
  return `${fromLabel} - ${toLabel}`;
}

export default function TransactionDateFilter({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(toDateInputValue(value.from));
  const [customTo, setCustomTo] = useState(toDateInputValue(value.to));
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomFrom(toDateInputValue(value.from));
    setCustomTo(toDateInputValue(value.to));
  }, [value.from, value.to]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasFilter = Boolean(value.from || value.to);

  const applyCustomRange = () => {
    onChange({
      from: customFrom ? startOfDayIso(customFrom) : undefined,
      to: customTo ? endOfDayIso(customTo) : undefined,
    });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg whitespace-nowrap transition ${
          hasFilter ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:bg-ink-100'
        }`}
      >
        <Calendar className="w-3.5 h-3.5" />
        {dateRangeLabel(value)}
      </button>
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 z-20 w-64 bg-white border border-ink-200 rounded-2xl shadow-lg p-4 space-y-3"
        >
          <p className="text-sm font-semibold">Rentang tanggal</p>
          <div className="flex flex-col gap-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onChange(preset.range());
                  setOpen(false);
                }}
                className="text-left px-2.5 py-1.5 text-xs font-medium rounded-lg text-ink-600 hover:bg-ink-100 transition"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-ink-200 space-y-2">
            <p className="text-xs text-ink-500">Custom</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
              />
              <span className="text-xs text-ink-400">-</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-ink-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={applyCustomRange}
              disabled={!customFrom && !customTo}
              className="w-full py-2 bg-ink-900 hover:bg-ink-800 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
