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
      SELECT s.id, a.slug AS activity_slug, a.name AS activity_name,
             s.session_date::text AS slot_date, s.session_time AS slot_time,
             s.capacity, s.spots_remaining
      FROM sessions s
      JOIN activities a ON a.id = s.activity_id
      WHERE a.slug = ${activity} AND s.session_date >= CURRENT_DATE AND s.status = 'active'
      ORDER BY s.session_date ASC, s.session_time ASC
      LIMIT 30
    `;
    return NextResponse.json({ slots: rows });
  } catch (err) {
    console.error('[api/bookings/slots] failed to load slots', err);
    return NextResponse.json({ error: 'Could not load availability right now. Please try again shortly.' }, { status: 500 });
  }
}
