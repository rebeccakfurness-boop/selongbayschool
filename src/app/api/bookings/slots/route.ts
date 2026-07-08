import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const activity = req.nextUrl.searchParams.get('activity');
  if (!activity) {
    return NextResponse.json({ error: 'Missing activity parameter' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = await sql`
      SELECT id, activity_slug, activity_name, slot_date::text AS slot_date, slot_time, capacity, spots_remaining
      FROM booking_slots
      WHERE activity_slug = ${activity} AND slot_date >= CURRENT_DATE
      ORDER BY slot_date ASC, slot_time ASC
      LIMIT 30
    `;
    return NextResponse.json({ slots: rows });
  } catch (err) {
    console.error('[api/bookings/slots] failed to load slots', err);
    return NextResponse.json({ error: 'Could not load availability right now. Please try again shortly.' }, { status: 500 });
  }
}
