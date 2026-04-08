import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const revalidate = 0;

export async function GET() {
  const { data, error } = await supabase
    .from('kpi_latest')
    .select('*')
    .order('kpi_key');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ kpis: data, fetchedAt: new Date().toISOString() });
}
