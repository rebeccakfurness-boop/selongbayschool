import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { z } from 'zod';

const bodySchema = z.object({ isActive: z.boolean() });

/** Deactivate/reactivate rather than delete — a staff account's id is referenced by
 * class_schedule.teacher_id, lesson_plans.teacher_id, and schedule_session_history.changed_by,
 * so removing the row outright would either fail (FK) or blank out "who taught this"/"who made
 * this change" on real historical records. Deactivating blocks login (see /api/admin/login) and
 * drops them from teacher-assignment pickers instead. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid staff id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }

  if (id === staff.adminUserId && !parsed.data.isActive) {
    return NextResponse.json({ error: "You can't deactivate your own account." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = await sql`
      UPDATE admin_users SET is_active = ${parsed.data.isActive} WHERE id = ${id} RETURNING id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Staff account not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/staff/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not update staff account.' }, { status: 500 });
  }
}
