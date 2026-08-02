import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { reviewGuardianRequestSchema } from '@/lib/validation';

/** Approves or rejects a self-service /account/link-child request — see the schema comment on
 * guardian_children.status. Approving here is the only way a self-linked child ever becomes
 * visible in the parent's portal (and usable for attendance check-in/out). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ customerId: string; childId: string }> }) {
  const staff = await requireAdmin();
  const { customerId: customerIdParam, childId: childIdParam } = await params;
  const customerId = Number(customerIdParam);
  const childId = Number(childIdParam);
  if (!Number.isInteger(customerId) || !Number.isInteger(childId)) {
    return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = reviewGuardianRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid decision.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = await sql`
      UPDATE guardian_children SET status = ${parsed.data.decision}, reviewed_by = ${staff.adminUserId}, reviewed_at = now()
      WHERE customer_id = ${customerId} AND child_id = ${childId} AND status = 'pending'
      RETURNING id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Request not found or already reviewed.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/guardian-requests/:customerId/:childId] failed to review', err);
    return NextResponse.json({ error: 'Could not save the decision.' }, { status: 500 });
  }
}
