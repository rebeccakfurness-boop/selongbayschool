import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { isCalendarConnected } from '@/lib/google-calendar';
import { createOrUpdateMeetingForOccurrence } from '@/lib/session-meetings';

export const dynamic = 'force-dynamic';

/** Bounded per run, same reason as every other batched job in this codebase: each row here is a
 * real Google Calendar API round trip (create or update), and this route has no maxDuration
 * override so it inherits Vercel's default function timeout — a handful of slow external calls per
 * invocation is safe, hundreds sequentially is exactly the mechanism that caused the original
 * regenerateScheduleOccurrences timeout bug (see that function's comments), just with HTTP latency
 * standing in for DB round trips this time. A large backlog (e.g. right after a new term is
 * generated) clears over several days of runs rather than in one shot. */
const BATCH_SIZE = 20;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureSchema();

    if (!(await isCalendarConnected())) {
      return NextResponse.json({ ok: true, skipped: 'Google Calendar not connected.' });
    }

    const pending = (await sql`
      SELECT id FROM schedule_session_occurrences
      WHERE calendar_sync_status = 'pending'
      ORDER BY starts_at ASC
      LIMIT ${BATCH_SIZE}
    `) as unknown as { id: number }[];

    let synced = 0;
    let failed = 0;
    for (const row of pending) {
      const result = await createOrUpdateMeetingForOccurrence(row.id);
      if (result.ok) synced++;
      else failed++;
    }

    return NextResponse.json({ ok: true, checked: pending.length, synced, failed });
  } catch (err) {
    console.error('[api/cron/sync-session-meetings] failed', err);
    return NextResponse.json({ error: 'Cron job failed.' }, { status: 500 });
  }
}
