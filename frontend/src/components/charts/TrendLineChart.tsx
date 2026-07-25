import { Line } from 'react-chartjs-2';
import { CategoryScale, Chart as ChartJS, Filler, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js';
import type { CashflowPoint } from '../../features/reports/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

function compactAxisLabel(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}jt`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
}

export default function TrendLineChart({ data }: { data: CashflowPoint[] }) {
  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: 'Pemasukan',
        data: data.map((d) => d.income),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        borderWidth: 2,
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#10b981',
      },
      {
        label: 'Pengeluaran',
        data: data.map((d) => d.expense),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244,63,94,0.05)',
        borderWidth: 2,
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#f43f5e',
      },
      {
        label: 'Savings',
        data: data.map((d) => d.savings),
        borderColor: '#8b5cf6',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 4],
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: '#8b5cf6',
      },
    ],
  };

  return (
    <Line
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
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
          y: {
            grid: { color: '#f1f5f9' },
            border: { display: false },
            ticks: { color: '#94a3b8', font: { size: 11 }, callback: (v) => compactAxisLabel(Number(v)) },
          },
        },
      }}
    />
  );
}
