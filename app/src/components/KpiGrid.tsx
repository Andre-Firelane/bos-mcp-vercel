import type { KpiRow } from '@/lib/types';
import { KpiCard } from './KpiCard';

export function KpiGrid({ kpis }: { kpis: KpiRow[] }) {
  if (kpis.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 rounded-xl border border-white/10 bg-white/5">
        <p className="text-gray-500">
          Keine KPI-Daten vorhanden. Importer noch nicht ausgeführt?
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.kpi_key} kpi={kpi} />
      ))}
    </div>
  );
}
