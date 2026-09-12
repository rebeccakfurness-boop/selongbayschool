import { NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getResourceRequestForGuard, markResourceRequestReimbursed } from '@/lib/resource-requests';

/** Admin-only, and only from an approved request that actually has a receipt on file -- paying
 * someone back without either a yes-you-can-buy-this decision or proof of what they spent isn't
 * something this button should let happen by accident. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid request id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const existing = await getResourceRequestForGuard(id);
    if (!existing) {
      return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    }
    if (existing.status !== 'approved') {
      return NextResponse.json({ error: 'Only an approved request can be marked reimbursed.' }, { status: 409 });
    }
    if (!existing.receipt_url) {
      return NextResponse.json({ error: 'A receipt or invoice must be on file before marking this reimbursed.' }, { status: 409 });
    }
    await markResourceRequestReimbursed(id, staff.adminUserId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/resource-requests/:id/reimburse] failed', err);
    return NextResponse.json({ error: 'Could not mark that request reimbursed.' }, { status: 500 });
  }
}
