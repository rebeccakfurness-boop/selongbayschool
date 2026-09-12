import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { createResourceRequestSchema, firstIssueMessage } from '@/lib/validation';
import { getResourceRequestsForStaff, getAllResourceRequests, createResourceRequest } from '@/lib/resource-requests';

/** GET: admin sees every request across the school (for the approval queue); any other staff
 * member sees only their own. POST: any logged-in staff member can submit a request — either
 * asking for approval to buy something, or (if they've already bought it) attaching a receipt
 * straight away and asking for approval + reimbursement together. */
export async function GET() {
  const staff = await getCurrentStaff();
  try {
    await ensureSchema();
    if (staff.role === 'admin') {
      const requests = await getAllResourceRequests();
      return NextResponse.json({ requests });
    }
    const requests = await getResourceRequestsForStaff(staff.adminUserId);
    return NextResponse.json({ requests });
  } catch (err) {
    console.error('[api/admin/resource-requests] failed to load', err);
    return NextResponse.json({ error: 'Could not load resource requests.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = createResourceRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error, 'Invalid request.') }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const row = await createResourceRequest(staff.adminUserId, d);
    return NextResponse.json(row);
  } catch (err) {
    console.error('[api/admin/resource-requests] failed to create', err);
    return NextResponse.json({ error: 'Could not submit that request.' }, { status: 500 });
  }
}
