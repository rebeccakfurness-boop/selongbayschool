import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { linkChildRequestSchema } from '@/lib/validation';

/** Creates (or re-opens, if previously rejected) a 'pending' guardian_children row — never
 * 'approved' directly, that only happens via an admin decision at /admin/attendance. See the
 * schema comment on guardian_children.status for why self-service links start untrusted. */
export async function POST(req: NextRequest) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = linkChildRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
  }
  const { childId, relationship } = parsed.data;

  try {
    await ensureSchema();
    const child = await sql`SELECT id FROM children WHERE id = ${childId} AND is_active = true`;
    if (child.length === 0) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    const [existing] = (await sql`
      SELECT status FROM guardian_children WHERE customer_id = ${session.customerId} AND child_id = ${childId}
    `) as unknown as { status: string }[];

    if (existing?.status === 'approved') {
      return NextResponse.json({ ok: true, status: 'approved', message: 'This child is already linked to your account.' });
    }
    if (existing?.status === 'pending') {
      return NextResponse.json({ ok: true, status: 'pending', message: 'A link request for this child is already pending review.' });
    }

    await sql`
      INSERT INTO guardian_children (customer_id, child_id, relationship, status, requested_at, reviewed_by, reviewed_at)
      VALUES (${session.customerId}, ${childId}, ${relationship ?? null}, 'pending', now(), NULL, NULL)
      ON CONFLICT (customer_id, child_id) DO UPDATE SET
        relationship = EXCLUDED.relationship, status = 'pending', requested_at = now(), reviewed_by = NULL, reviewed_at = NULL
    `;
    return NextResponse.json({ ok: true, status: 'pending', message: 'Request sent — the school office will review it shortly.' });
  } catch (err) {
    console.error('[api/account/link-child/request] failed', err);
    return NextResponse.json({ error: 'Could not send the request.' }, { status: 500 });
  }
}
