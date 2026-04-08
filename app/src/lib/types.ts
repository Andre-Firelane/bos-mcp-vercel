export interface KpiRow {
  id: string;
  kpi_key: string;
  kpi_label: string;
  kpi_value: string;
  kpi_unit: string;
  imported_at: string; // ISO 8601
  metadata: Record<string, unknown>;
}

export interface KpiHistoryPoint {
  kpi_value: string;
  imported_at: string;
}
