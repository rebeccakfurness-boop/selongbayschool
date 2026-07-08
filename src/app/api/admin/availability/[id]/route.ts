import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureSchema, sql } from '@/lib/db';

const updateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().min(1).max(50).optional(),
  capacity: z.coerce.number().int().positive().max(500).optional(),
  spotsRemaining: z.coerce.number().int().min(0).max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid slot id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }
  const { date, time, capacity, spotsRemaining } = parsed.data;

  try {
    await ensureSchema();
    const rows = await sql`
      UPDATE booking_slots
      SET
        slot_date = COALESCE(${date ?? null}, slot_date),
        slot_time = COALESCE(${time ?? null}, slot_time),
        capacity = COALESCE(${capacity ?? null}, capacity),
        spots_remaining = COALESCE(${spotsRemaining ?? null}, spots_remaining)
      WHERE id = ${id}
      RETURNING id, activity_slug, activity_name, slot_date::text AS slot_date, slot_time, capacity, spots_remaining
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Slot not found.' }, { status: 404 });
    }
    return NextResponse.json({ slot: rows[0] });
  } catch (err) {
    console.error('[api/admin/availability/:id] failed to update slot', err);
    return NextResponse.json({ error: 'Could not update slot.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid slot id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const existingBookings = await sql`SELECT id FROM bookings WHERE slot_id = ${id} LIMIT 1`;
    if (existingBookings.length > 0) {
      return NextResponse.json(
        { error: 'This slot has existing bookings and cannot be deleted. Set capacity to 0 instead to stop new bookings.' },
        { status: 409 }
      );
    }
    const rows = await sql`DELETE FROM booking_slots WHERE id = ${id} RETURNING id`;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Slot not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/availability/:id] failed to delete slot', err);
    return NextResponse.json({ error: 'Could not delete slot.' }, { status: 500 });
  }
}
