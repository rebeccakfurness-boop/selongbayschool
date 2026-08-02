import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';

/** Deletes a mistaken attendance entry (kiosk mis-tap, duplicate, etc.) — no separate "edit"
 * endpoint, since fixing a wrong entry is delete-then-re-add-a-correction (POST .../attendance)
 * rather than mutating history in place. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; eventId: string }> }) {
  await getCurrentStaff();
  const { id: idParam, eventId: eventIdParam } = await params;
  const childId = Number(idParam);
  const eventId = Number(eventIdParam);
  if (!Number.isInteger(childId) || !Number.isInteger(eventId)) {
    return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await sql`DELETE FROM attendance_events WHERE id = ${eventId} AND child_id = ${childId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/children/:id/attendance/:eventId] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete the entry.' }, { status: 500 });
  }
}
