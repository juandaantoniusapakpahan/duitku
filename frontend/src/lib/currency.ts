const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatIDR(amount: number | string): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  return idrFormatter.format(Number.isFinite(value) ? value : 0).replace('IDR', 'Rp').replace(/\s+/, ' ');
}

export function formatIDRCompact(amount: number | string): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  const n = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000) return `Rp ${Math.round(n / 1_000)}k`;
  return formatIDR(n);
}
