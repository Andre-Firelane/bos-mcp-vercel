export interface KpiData {
  kpi_key: string;           // stable identifier, snake_case (e.g. "revenue_today")
  kpi_label: string;         // human-readable label (e.g. "Umsatz heute")
  kpi_value: string;         // raw string from BOS (e.g. "12.345,67")
  kpi_unit: string;          // unit string (e.g. "€", "%", "Stk.", "")
  metadata: Record<string, unknown>; // full raw response from BOS tool
}
