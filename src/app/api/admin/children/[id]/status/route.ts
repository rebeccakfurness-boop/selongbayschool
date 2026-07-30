import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { updateChildStatusSchema } from '@/lib/validation';
import { checkActiveStatusGuardRail, needsTuitionInvoicePrompt, isActiveStatus } from '@/lib/child-lifecycle';
import { sendChildActivatedInvoicePrompt } from '@/lib/email';
import { STATUS_LEGEND, type ChildStatus } from '@/lib/family-data';
import { siteConfig } from '@/lib/site-content';

/** The only route that changes status/is_active on an existing child — called exclusively by the
 * Family Board's drag handler (src/components/admin/FamilyBoard.tsx). Dragging a card is the only
 * way these fields change; the general PATCH /api/admin/children/[id] no longer accepts either
 * (see updateChildSchema). Enforces the lifecycle guard rail (an active status needs a start date
 * and programme already on file) server-side — the board also pre-checks this client-side using
 * data it already has, for a same-tick inline message, but this is the actual boundary. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  if (staff.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can move family cards.' }, { status: 403 });
  }

  const { id: idParam } = await params;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) {
    return NextResponse.json({ error: 'Invalid child id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = updateChildStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();

    if (d.status) {
      const guard = await checkActiveStatusGuardRail(childId, d.status);
      if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: 422 });
      }
    }

    const rows = await sql`
      UPDATE children SET
        status = COALESCE(${d.status ?? null}, status),
        is_active = COALESCE(${d.isActive ?? null}, is_active),
        updated_at = now()
      WHERE id = ${childId}
      RETURNING id, child_full_name, status
    `;
    const child = rows[0];
    if (!child) {
      return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
    }

    if (d.status && isActiveStatus(d.status as ChildStatus) && (await needsTuitionInvoicePrompt(childId))) {
      const createInvoiceUrl = new URL(`/admin/families/${childId}/invoices/new?type=tuition`, siteConfig.url).toString();
      await sendChildActivatedInvoicePrompt({
        childFullName: child.child_full_name as string,
        statusLabel: STATUS_LEGEND[d.status as ChildStatus].label,
        createInvoiceUrl,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/children/:id/status] failed to update status', err);
    return NextResponse.json({ error: 'Could not save that move.' }, { status: 500 });
  }
}
