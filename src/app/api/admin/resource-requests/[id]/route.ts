import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { attachResourceRequestReceiptSchema, decideResourceRequestSchema, firstIssueMessage } from '@/lib/validation';
import { getResourceRequestForGuard, attachResourceRequestReceipt, decideResourceRequest, deleteResourceRequest } from '@/lib/resource-requests';

/** Two disjoint things happen through this one PATCH, gated by who's allowed to do which:
 * - Attaching/updating a receipt (`receiptUrl` in the body) is the requester's own action — they
 *   hold the paper trail — allowed for the owner or an admin, and only before the request is
 *   settled (rejected/reimbursed).
 * - Approving/rejecting and/or editing the office's internal note (anything else in the body —
 *   `status`, `adminNotes`, or both) is admin-only, and only while it isn't already reimbursed
 *   (undoing a reimbursement needs a human to sort out separately, not a status flip).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid request id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const existing = await getResourceRequestForGuard(id);
    if (!existing) {
      return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    }

    const isReceiptAttach = body !== null && typeof body === 'object' && 'receiptUrl' in body;
    if (!isReceiptAttach) {
      if (staff.role !== 'admin') {
        return NextResponse.json({ error: 'Only admins can approve, reject, or annotate a request.' }, { status: 403 });
      }
      if (existing.status === 'reimbursed') {
        return NextResponse.json({ error: 'This request has already been reimbursed.' }, { status: 409 });
      }
      const parsed = decideResourceRequestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: firstIssueMessage(parsed.error, 'Invalid decision.') }, { status: 400 });
      }
      await decideResourceRequest(id, staff.adminUserId, parsed.data);
      return NextResponse.json({ ok: true });
    }

    // Receipt attach/update.
    // String(...): requested_by is a raw BIGSERIAL string at runtime despite its `number` type
    // (see other staff self-service routes' comments for why) -- a plain !== would always reject.
    const isOwner = String(existing.requested_by) === String(staff.adminUserId);
    if (staff.role !== 'admin' && !isOwner) {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
    }
    if (existing.status === 'rejected' || existing.status === 'reimbursed') {
      return NextResponse.json({ error: 'This request is already settled.' }, { status: 409 });
    }
    const parsed = attachResourceRequestReceiptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstIssueMessage(parsed.error, 'Invalid receipt.') }, { status: 400 });
    }
    await attachResourceRequestReceipt(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/resource-requests/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not update that request.' }, { status: 500 });
  }
}

/** Withdrawing a request you haven't heard back on yet is the requester's own call; an admin can
 * remove any request (e.g. a duplicate or a mistaken entry) regardless of status. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
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
    const isOwner = String(existing.requested_by) === String(staff.adminUserId);
    if (staff.role !== 'admin') {
      if (!isOwner) {
        return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
      }
      if (existing.status !== 'pending') {
        return NextResponse.json({ error: 'You can only withdraw a request that is still pending.' }, { status: 409 });
      }
    }
    await deleteResourceRequest(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/resource-requests/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not remove that request.' }, { status: 500 });
  }
}
