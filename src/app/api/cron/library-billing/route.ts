import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { runLibraryBilling } from '@/lib/library';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureSchema();
    const result = await runLibraryBilling();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[api/cron/library-billing] failed', err);
    return NextResponse.json({ error: 'Cron job failed.' }, { status: 500 });
  }
}
