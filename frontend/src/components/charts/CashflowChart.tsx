import { Bar } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import type { CashflowPoint } from '../../features/reports/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

function compactAxisLabel(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}jt`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
}

export default function CashflowChart({ data }: { data: CashflowPoint[] }) {
  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: 'Masuk',
        data: data.map((d) => d.income),
        backgroundColor: '#8b5cf6',
        borderRadius: 6,
        barPercentage: 0.55,
        categoryPercentage: 0.6,
      },
      {
        label: 'Keluar',
        data: data.map((d) => d.expense),
        backgroundColor: '#e2e8f0',
        borderRadius: 6,
        barPercentage: 0.55,
        categoryPercentage: 0.6,
      },
    ],
  };

  return (
    <Bar
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 10,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: Rp ${Number(ctx.parsed.y).toLocaleString('id-ID')}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: { font: { size: 11 }, color: '#94a3b8', callback: (v) => compactAxisLabel(Number(v)) },
            border: { display: false },
          },
        },
      }}
    />
  );
}
