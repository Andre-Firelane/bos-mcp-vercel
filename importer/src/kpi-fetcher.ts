import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { KpiData } from './types.js';

type KpiFetcher = (client: Client) => Promise<KpiData>;

// Helper: call the BOS 'query' tool and parse the result rows
async function bQuery(client: Client, sql: string): Promise<Record<string, unknown>[]> {
  const result = await client.callTool({ name: 'query', arguments: { sql } });
  const content = result.content as Array<{ type: string; text: string }>;
  const parsed = JSON.parse(content[0].text) as unknown;
  if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
  const obj = parsed as Record<string, unknown>;
  if (Array.isArray(obj.rows)) return obj.rows as Record<string, unknown>[];
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Wochendefinition: Samstag–Freitag (wie im BOS-System)
// Wochenbeginn-Formel (MySQL):
//   DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) % 7 DAY)
//   DAYOFWEEK: So=1, Mo=2, ..., Sa=7  →  Sa=0, So=1, Mo=2, ... Tage seit Sa
//
// Datumsfelder:
//   anf_timestamp  — Eingang der Anfrage (in mcp_vorgaenge)
//   op_datum       — Buchungsdatum / Rechnungsdatum (in mcp_vorgaenge)
// ─────────────────────────────────────────────────────────────────────────────

// 1. Anfragen diese Woche (nach anf_timestamp, alle Status)
async function fetchAnfragenDieseWoche(client: Client): Promise<KpiData> {
  const rows = await bQuery(client, `
    SELECT COUNT(DISTINCT vog_akww) AS cnt
    FROM mcp_vorgaenge
    WHERE DATE(anf_timestamp) >= DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) % 7 DAY)
  `);
  const cnt = Number(rows[0]?.cnt ?? 0);
  return {
    kpi_key: 'anfragen_diese_woche',
    kpi_label: 'Anfragen diese Woche',
    kpi_value: cnt.toLocaleString('de-DE'),
    kpi_unit: '',
    metadata: { rows },
  };
}

// 2. Buchungen diese Woche (nach op_datum, nur bestätigte, ohne Stornos)
async function fetchBuchungenDieseWoche(client: Client): Promise<KpiData> {
  const rows = await bQuery(client, `
    SELECT COUNT(DISTINCT vog_akww) AS cnt
    FROM mcp_vorgaenge
    WHERE DATE(op_datum) >= DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) % 7 DAY)
      AND vog_status_name IN (
        'booking', 'Buchung', 'Onlinebuchung', 'online booking',
        'booking in process', 'booking change in process',
        'Buchung in Bearbeitung', 'Umbuchung in Bearbeitung'
      )
      AND (op_storno IS NULL OR op_storno = 0)
  `);
  const cnt = Number(rows[0]?.cnt ?? 0);
  return {
    kpi_key: 'buchungen_diese_woche',
    kpi_label: 'Buchungen diese Woche',
    kpi_value: cnt.toLocaleString('de-DE'),
    kpi_unit: '',
    metadata: { rows },
  };
}

// 3. Umsatz diese Woche (nach op_datum, bestätigte Buchungen, ohne Stornos)
async function fetchUmsatzDieseWoche(client: Client): Promise<KpiData> {
  const rows = await bQuery(client, `
    SELECT ROUND(SUM(op_rechbetrag), 2) AS total
    FROM mcp_vorgaenge
    WHERE DATE(op_datum) >= DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE()) % 7 DAY)
      AND vog_status_name IN (
        'booking', 'Buchung', 'Onlinebuchung', 'online booking',
        'booking in process', 'booking change in process',
        'Buchung in Bearbeitung', 'Umbuchung in Bearbeitung'
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
    metadata: { rows },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
export const KPI_FETCHERS: KpiFetcher[] = [
  fetchAnfragenDieseWoche,
  fetchBuchungenDieseWoche,
  fetchUmsatzDieseWoche,
];
