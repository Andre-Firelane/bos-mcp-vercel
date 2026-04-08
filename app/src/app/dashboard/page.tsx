import { supabase } from '@/lib/supabase';
import type { KpiRow, KpiHistoryPoint } from '@/lib/types';
import { KpiGrid } from '@/components/KpiGrid';
import { KpiChart } from '@/components/KpiChart';
import { LastImportBadge } from '@/components/LastImportBadge';
import { RefreshProvider } from '@/components/RefreshProvider';

// Which KPI key to show in the chart (change after running 'npm run discover')
const CHART_KPI_KEY = process.env.CHART_KPI_KEY ?? '';

export default async function DashboardPage() {
  // Fetch all latest KPI values
  const { data: kpis } = await supabase
    .from('kpi_latest')
    .select('*')
    .order('kpi_key')
    .returns<KpiRow[]>();

  // Fetch chart history for the configured KPI (last 48 data points)
  const { data: history } = CHART_KPI_KEY
    ? await supabase
        .from('kpi_snapshots')
        .select('kpi_value, imported_at')
        .eq('kpi_key', CHART_KPI_KEY)
        .order('imported_at', { ascending: true })
        .limit(48)
        .returns<KpiHistoryPoint[]>()
    : { data: null };

  const chartLabel =
    kpis?.find((k) => k.kpi_key === CHART_KPI_KEY)?.kpi_label ?? 'Verlauf';
  const lastImport = kpis?.[0]?.imported_at ?? null;

  return (
    <RefreshProvider>
      <main className="min-h-screen p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">KPI Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">BOS MCP · Supabase</p>
            </div>
            <LastImportBadge importedAt={lastImport} />
          </div>

          {/* KPI Cards */}
          <KpiGrid kpis={kpis ?? []} />

          {/* Chart (only shown if CHART_KPI_KEY is configured and has data) */}
          {history && history.length >= 2 && (
            <KpiChart
              data={history}
              label={chartLabel}
              className="mt-8"
            />
          )}
        </div>
      </main>
    </RefreshProvider>
  );
}
