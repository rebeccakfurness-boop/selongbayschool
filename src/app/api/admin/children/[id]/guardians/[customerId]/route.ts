import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; customerId: string }> }) {
  await requireAdmin();
  const { id: idParam, customerId: customerIdParam } = await params;
  const childId = Number(idParam);
  const customerId = Number(customerIdParam);
  if (!Number.isInteger(childId) || !Number.isInteger(customerId)) {
    return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await sql`DELETE FROM guardian_children WHERE child_id = ${childId} AND customer_id = ${customerId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/children/:id/guardians/:customerId] failed to unlink', err);
    return NextResponse.json({ error: 'Could not unlink guardian.' }, { status: 500 });
  }
}
