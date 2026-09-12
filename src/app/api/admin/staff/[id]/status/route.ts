import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { updateStaffStatusSchema } from '@/lib/validation';
import { checkActiveEmploymentGuardRail } from '@/lib/staff-lifecycle';

/** The only route that changes employment_status on an existing staff member -- called
 * exclusively by the Teacher Board's drag handler (src/components/admin/StaffBoard.tsx), mirroring
 * /api/admin/children/[id]/status exactly. Enforces the lifecycle guard rail (an active employee
 * status needs a start date already on file) server-side -- the board also pre-checks this
 * client-side for an immediate inline message, but this is the real boundary. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  if (staff.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can move staff cards.' }, { status: 403 });
  }

  const { id: idParam } = await params;
  const adminUserId = Number(idParam);
  if (!Number.isInteger(adminUserId)) {
    return NextResponse.json({ error: 'Invalid staff id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = updateStaffStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();

    const guard = await checkActiveEmploymentGuardRail(adminUserId, d.status);
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: 422 });
    }

    const rows = await sql`
      UPDATE admin_users SET employment_status = ${d.status} WHERE id = ${adminUserId} RETURNING id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Staff member not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/staff/:id/status] failed to update status', err);
    return NextResponse.json({ error: 'Could not save that move.' }, { status: 500 });
  }
}
