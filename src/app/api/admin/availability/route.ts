import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { availabilitySlotSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureSchema();
    const rows = await sql`
      SELECT id, activity_slug, activity_name, slot_date::text AS slot_date, slot_time, capacity, spots_remaining
      FROM booking_slots
      ORDER BY slot_date ASC, slot_time ASC
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
  const { activitySlug, activityName, date, time, capacity } = parsed.data;

  try {
    await ensureSchema();
    const rows = await sql`
      INSERT INTO booking_slots (activity_slug, activity_name, slot_date, slot_time, capacity, spots_remaining)
      VALUES (${activitySlug}, ${activityName}, ${date}, ${time}, ${capacity}, ${capacity})
      RETURNING id, activity_slug, activity_name, slot_date::text AS slot_date, slot_time, capacity, spots_remaining
    `;
    return NextResponse.json({ slot: rows[0] });
  } catch (err) {
    console.error('[api/admin/availability] failed to create slot', err);
    return NextResponse.json({ error: 'Could not create slot.' }, { status: 500 });
  }
}
