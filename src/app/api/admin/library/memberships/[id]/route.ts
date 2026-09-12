import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const membershipId = Number(id);
  if (!Number.isInteger(membershipId)) {
    return NextResponse.json({ error: 'Invalid membership id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const d = body as { monthlyFeeIdr?: number; discountPercent?: number; status?: string };
  if (d.status && !['active', 'cancelled'].includes(d.status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  try {
    await sql`
      UPDATE library_memberships SET
        monthly_fee_idr = COALESCE(${d.monthlyFeeIdr ?? null}, monthly_fee_idr),
        discount_percent = COALESCE(${d.discountPercent ?? null}, discount_percent),
        status = COALESCE(${d.status ?? null}, status),
        cancelled_at = CASE WHEN ${d.status ?? null} = 'cancelled' THEN CURRENT_DATE ELSE cancelled_at END
      WHERE id = ${membershipId}
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/library/memberships/:id] failed', err);
    return NextResponse.json({ error: 'Could not update this membership.' }, { status: 500 });
  }
}
