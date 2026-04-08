-- BOS MCP KPI Dashboard – Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- kpi_snapshots: one row per KPI per import run (history is preserved)
-- kpi_value is TEXT to handle locale-formatted strings from BOS (e.g. "1.234,56")
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kpi_snapshots (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  kpi_key     TEXT        NOT NULL,
  kpi_label   TEXT        NOT NULL,
  kpi_value   TEXT        NOT NULL,
  kpi_unit    TEXT        NOT NULL DEFAULT '',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata    JSONB       NOT NULL DEFAULT '{}'::jsonb
);

-- Optimized for: latest-per-key queries and time-series chart queries
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_key_time
  ON public.kpi_snapshots (kpi_key, imported_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- Vercel uses anon key → read-only via policy
-- Importer uses service role key → bypasses RLS automatically
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.kpi_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can select"
  ON public.kpi_snapshots
  FOR SELECT
  TO anon
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- kpi_latest: convenience view – one row per kpi_key (most recent value)
-- Used by the dashboard's Server Component
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.kpi_latest AS
SELECT DISTINCT ON (kpi_key)
  id,
  kpi_key,
  kpi_label,
  kpi_value,
  kpi_unit,
  imported_at,
  metadata
FROM public.kpi_snapshots
ORDER BY kpi_key, imported_at DESC;
