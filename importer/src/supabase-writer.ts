import { createClient } from '@supabase/supabase-js';
import type { KpiData } from './types.js';

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set in .env');
  }
  return createClient(url, key);
}

export async function upsertKpis(kpis: KpiData[]): Promise<void> {
  const supabase = getSupabaseClient();
  const importedAt = new Date().toISOString();

  const rows = kpis.map((k) => ({
    kpi_key: k.kpi_key,
    kpi_label: k.kpi_label,
    kpi_value: k.kpi_value,
    kpi_unit: k.kpi_unit,
    imported_at: importedAt,
    metadata: k.metadata,
  }));

  const { error } = await supabase.from('kpi_snapshots').insert(rows);
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);

  console.log(
    `[importer] Inserted ${rows.length} KPI row(s) at ${importedAt}`
  );
}
