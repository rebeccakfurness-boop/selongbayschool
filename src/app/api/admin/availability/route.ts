import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { availabilitySlotSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureSchema();
    const rows = await sql`
      SELECT s.id, a.slug AS activity_slug, a.name AS activity_name,
             s.session_date::text AS slot_date, s.session_time AS slot_time,
             s.capacity, s.spots_remaining
      FROM sessions s
      JOIN activities a ON a.id = s.activity_id
      ORDER BY s.session_date ASC, s.session_time ASC
    `;
    return NextResponse.json({ slots: rows });
  } catch (err) {
    console.error('[api/admin/availability] failed to load slots', err);
    return NextResponse.json({ error: 'Could not load slots.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = availabilitySlotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid slot data.' }, { status: 400 });
  }
  const { activitySlug, date, time, capacity } = parsed.data;

  try {
    await ensureSchema();
    const activityRows = await sql`SELECT id FROM activities WHERE slug = ${activitySlug}`;
    if (activityRows.length === 0) {
      return NextResponse.json({ error: 'Unknown activity.' }, { status: 400 });
    }
    const activityId = activityRows[0].id;

    const rows = await sql`
      WITH inserted AS (
        INSERT INTO sessions (activity_id, session_date, session_time, capacity, spots_remaining)
        VALUES (${activityId}, ${date}, ${time}, ${capacity}, ${capacity})
        RETURNING id, activity_id, session_date, session_time, capacity, spots_remaining
      )
      SELECT inserted.id, a.slug AS activity_slug, a.name AS activity_name,
             inserted.session_date::text AS slot_date, inserted.session_time AS slot_time,
             inserted.capacity, inserted.spots_remaining
      FROM inserted
      JOIN activities a ON a.id = inserted.activity_id
    `;
    return NextResponse.json({ slot: rows[0] });
  } catch (err) {
    console.error('[api/admin/availability] failed to create slot', err);
    return NextResponse.json({ error: 'Could not create slot.' }, { status: 500 });
  }
}
