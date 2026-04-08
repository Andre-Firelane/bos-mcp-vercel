import type { KpiRow } from '@/lib/types';

const STALE_THRESHOLD_MS = 45 * 60 * 1000;

export function KpiCard({ kpi }: { kpi: KpiRow }) {
  const isStale =
    Date.now() - new Date(kpi.imported_at).getTime() > STALE_THRESHOLD_MS;

  return (
    <div
      className={`rounded-xl border p-5 transition-colors ${
        isStale ? 'border-yellow-600/50' : 'border-white/10'
      } bg-white/5`}
    >
      <p className="text-sm text-gray-400 truncate">{kpi.kpi_label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums leading-none">
        {kpi.kpi_value}
        {kpi.kpi_unit && (
          <span className="ml-1 text-lg font-normal text-gray-400">
            {kpi.kpi_unit}
          </span>
        )}
      </p>
      {isStale && (
        <p className="mt-2 text-xs text-yellow-500">Daten veraltet</p>
      )}
    </div>
  );
}
