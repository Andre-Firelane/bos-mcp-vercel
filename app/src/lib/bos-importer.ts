import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { createClient } from '@supabase/supabase-js';

// ─── MCP Client ───────────────────────────────────────────────────────────────

async function createMcpClient(): Promise<Client> {
  const url = process.env.BOS_MCP_URL;
  if (!url) throw new Error('BOS_MCP_URL env var is not set');

  const transport = new SSEClientTransport(new URL(url));
  const client = new Client(
    { name: 'bos-kpi-importer-vercel', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );
  await client.connect(transport);
  return client;
}

async function bQuery(client: Client, sql: string): Promise<Record<string, unknown>[]> {
  const result = await client.callTool({ name: 'query', arguments: { sql } });
  const content = result.content as Array<{ type: string; text: string }>;
  const parsed = JSON.parse(content[0].text) as unknown;
  if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
  const obj = parsed as Record<string, unknown>;
  return Array.isArray(obj.rows) ? (obj.rows as Record<string, unknown>[]) : [];
}

// ─── KPI Queries ──────────────────────────────────────────────────────────────
// Wochendefinition: Samstag–Freitag
// DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) % 7 DAY)

interface KpiData {
  kpi_key: string;
  kpi_label: string;
  kpi_value: string;
  kpi_unit: string;
  metadata: Record<string, unknown>;
}

async function fetchAnfragen(client: Client): Promise<KpiData> {
  const rows = await bQuery(client, `
    SELECT COUNT(DISTINCT vog_akww) AS cnt
    FROM mcp_vorgaenge
    WHERE DATE(anf_timestamp) >= DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) % 7 DAY)
  `);
  return {
    kpi_key: 'anfragen_diese_woche',
    kpi_label: 'Anfragen diese Woche',
    kpi_value: Number(rows[0]?.cnt ?? 0).toLocaleString('de-DE'),
    kpi_unit: '',
    metadata: {},
  };
}

async function fetchBuchungen(client: Client): Promise<KpiData> {
  const rows = await bQuery(client, `
    SELECT COUNT(DISTINCT vog_akww) AS cnt
    FROM mcp_vorgaenge
    WHERE DATE(op_datum) >= DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) % 7 DAY)
      AND vog_status_name IN (
        'booking','Buchung','Onlinebuchung','online booking',
        'booking in process','booking change in process',
        'Buchung in Bearbeitung','Umbuchung in Bearbeitung'
      )
      AND (op_storno IS NULL OR op_storno = 0)
  `);
  return {
    kpi_key: 'buchungen_diese_woche',
    kpi_label: 'Buchungen diese Woche',
    kpi_value: Number(rows[0]?.cnt ?? 0).toLocaleString('de-DE'),
    kpi_unit: '',
    metadata: {},
  };
}

async function fetchUmsatz(client: Client): Promise<KpiData> {
  const rows = await bQuery(client, `
    SELECT ROUND(SUM(op_rechbetrag), 2) AS total
    FROM mcp_vorgaenge
    WHERE DATE(op_datum) >= DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) % 7 DAY)
      AND vog_status_name IN (
        'booking','Buchung','Onlinebuchung','online booking',
        'booking in process','booking change in process',
        'Buchung in Bearbeitung','Umbuchung in Bearbeitung'
      )
      AND (op_storno IS NULL OR op_storno = 0)
      AND op_rechbetrag IS NOT NULL
  `);
  const total = Number(rows[0]?.total ?? 0);
  return {
    kpi_key: 'umsatz_diese_woche',
    kpi_label: 'Umsatz diese Woche',
    kpi_value: total.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    kpi_unit: '€',
    metadata: {},
  };
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function runImport(): Promise<{ imported: number; errors: number }> {
  const client = await createMcpClient();

  const fetchers = [fetchAnfragen, fetchBuchungen, fetchUmsatz];
  const results = await Promise.allSettled(fetchers.map((f) => f(client)));

  await client.close();

  const successful = results
    .filter((r): r is PromiseFulfilledResult<KpiData> => r.status === 'fulfilled')
    .map((r) => r.value);

  const failed = results.filter((r) => r.status === 'rejected');

  if (successful.length > 0) {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const importedAt = new Date().toISOString();
    const rows = successful.map((k) => ({ ...k, imported_at: importedAt }));
    const { error } = await supabase.from('kpi_snapshots').insert(rows);
    if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  }

  return { imported: successful.length, errors: failed.length };
}
