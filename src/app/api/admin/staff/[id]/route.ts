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

  // String(...): adminUserId is only ever type-asserted as `number` at login, never actually
  // converted — it's a raw BIGSERIAL string at runtime, same as every id in this codebase. A
  // plain === here would never match and this guard would silently never fire.
  if (String(id) === String(staff.adminUserId) && !parsed.data.isActive) {
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

/** Permanently removing the row, as opposed to PATCH above's deactivate. Only actually succeeds
 * for an account with no real footprint yet (an applicant, a duplicate, or one created in
 * error) — teacher_assignments is a pure join table so it's cleared first (same as
 * guardian_children in /api/admin/children/:id), but everything else referencing admin_users
 * (lesson_plans, class_schedule, incident_reports, payslips, and a couple dozen more) has no
 * cascade, by design (see the PATCH comment above): a real staff member's history shouldn't be
 * deletable by accident. Rather than hand-maintain a list of every such table (guaranteed to go
 * stale), this just lets Postgres's own constraint reject the DELETE and reports which table it
 * hit, pointing whoever's here at Deactivate instead. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid staff id.' }, { status: 400 });
  }
  // String(...): see the same-shaped check in PATCH above.
  if (String(id) === String(staff.adminUserId)) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const existing = await sql`SELECT id FROM admin_users WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Staff account not found.' }, { status: 404 });
    }

    await sql`DELETE FROM teacher_assignments WHERE admin_user_id = ${id}`;
    await sql`DELETE FROM admin_users WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes('violates foreign key constraint')) {
      const table = err.message.match(/ on table "([^"]+)"/)?.[1];
      return NextResponse.json(
        {
          error: `This staff member has existing records on file${table ? ` (${table.replace(/_/g, ' ')})` : ''} and can’t be permanently deleted. Deactivate them instead — that blocks login and removes them from pickers without losing their history.`,
        },
        { status: 409 }
      );
    }
    console.error('[api/admin/staff/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete staff account.' }, { status: 500 });
  }
}
