import { NextRequest, NextResponse } from 'next/server';
import { runImport } from '@/lib/bos-importer';

// Called by Vercel Cron (or external cron service)
// Protected by CRON_SECRET to prevent unauthorized triggers
export async function POST(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runImport();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/import] Error:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// Vercel Cron Jobs use GET
export async function GET(req: NextRequest) {
  // Vercel passes the CRON_SECRET automatically via the Authorization header
  // when the cron job is defined in vercel.json
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runImport();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/import] Error:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
