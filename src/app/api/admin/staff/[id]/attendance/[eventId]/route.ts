import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';

/** Deletes a mistaken attendance entry -- admin-only (see the correction route's comment on why
 * staff attendance is stricter than the equivalent child route). No separate "edit" endpoint:
 * fixing a wrong entry is delete-then-re-add-a-correction, same as for students. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; eventId: string }> }) {
  await requireAdmin();
  const { id: idParam, eventId: eventIdParam } = await params;
  const adminUserId = Number(idParam);
  const eventId = Number(eventIdParam);
  if (!Number.isInteger(adminUserId) || !Number.isInteger(eventId)) {
    return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await sql`DELETE FROM staff_attendance_events WHERE id = ${eventId} AND admin_user_id = ${adminUserId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/staff/:id/attendance/:eventId] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete the entry.' }, { status: 500 });
  }
}
