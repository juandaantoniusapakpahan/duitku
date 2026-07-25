import { Doughnut } from 'react-chartjs-2';
import { ArcElement, Chart as ChartJS, Tooltip } from 'chart.js';
import type { CategoryAmount } from '../../features/reports/types';

ChartJS.register(ArcElement, Tooltip);

const PALETTE = ['#f97316', '#8b5cf6', '#10b981', '#06b6d4', '#ec4899', '#f59e0b', '#ef4444', '#94a3b8'];

export default function CategoryDonut({ data }: { data: CategoryAmount[] }) {
  const chartData = {
    labels: data.map((d) => d.category?.name ?? 'Lainnya'),
    datasets: [
      {
        data: data.map((d) => d.amount),
        backgroundColor: data.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 0,
        spacing: 2,
      },
    ],
  };

  return (
    <Doughnut
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 10,
            callbacks: { label: (ctx) => `${ctx.label}: Rp ${Number(ctx.parsed).toLocaleString('id-ID')}` },
          },
        },
      }}
    />
  );
}
