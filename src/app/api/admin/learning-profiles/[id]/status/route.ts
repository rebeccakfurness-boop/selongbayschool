import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { updateLearningProfileStatusSchema } from '@/lib/validation';

/** Separate from the content-editing PATCH on /api/admin/learning-profiles/[id] (which any teacher
 * assigned to the class can use) -- approving a report is admin-only, so it gets its own verb and
 * its own gate, same split already used for invoices (status-only PATCH vs content PUT). Reverting
 * to 'draft' clears approved_at/approved_by but deliberately leaves sent_at alone: if the report
 * had already been emailed, that history isn't erased, it's just no longer enough on its own to
 * show the report in the Parent Portal (both the portal query and the PDF route's guardian/student
 * authorization require status='approved' AND sent_at IS NOT NULL together). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid report id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = updateLearningProfileStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid status.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = await sql`
      UPDATE learning_profiles SET
        status = ${parsed.data.status},
        approved_at = CASE WHEN ${parsed.data.status} = 'approved' THEN now() ELSE NULL END,
        approved_by = CASE WHEN ${parsed.data.status} = 'approved' THEN ${staff.adminUserId} ELSE NULL END
      WHERE id = ${id}
      RETURNING id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/learning-profiles/:id/status] failed to update', err);
    return NextResponse.json({ error: 'Could not update report status.' }, { status: 500 });
  }
}
