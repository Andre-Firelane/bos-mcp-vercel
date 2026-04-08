'use client';

import type { KpiHistoryPoint } from '@/lib/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface KpiChartProps {
  data: KpiHistoryPoint[];
  label?: string;
  className?: string;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function KpiChart({ data, label = 'Verlauf', className = '' }: KpiChartProps) {
  if (data.length < 2) return null;

  const chartData = data.map((d) => ({
    time: formatTime(d.imported_at),
    value: parseFloat(d.kpi_value.replace(/[^0-9,.-]/g, '').replace(',', '.')),
  }));

  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 p-5 ${className}`}>
      <p className="mb-4 text-sm text-gray-400">{label}</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip
            contentStyle={{
              background: '#111827',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#f9fafb',
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#60a5fa' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
