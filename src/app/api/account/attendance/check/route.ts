import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { guardianOwnsChild } from '@/lib/lms-data';
import { attendanceCheckSchema } from '@/lib/validation';
import { recordAttendanceEvent } from '@/lib/attendance';

/** Not covered by proxy.ts (its matcher only lists /account/:path*, not /api/account/:path* —
 * same gap noted on the lunch-order create route), so the customer session is checked directly
 * here, same pattern as guardianOwnsChild everywhere else in /api/account/*. */
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

  const parsed = attendanceCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid check-in.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    if (!(await guardianOwnsChild(session.customerId, d.childId))) {
      return NextResponse.json({ error: 'Not authorized for this child.' }, { status: 403 });
    }

    // The signer's name is never taken from the client here — the portal already knows exactly
    // who's signing (they're logged in), so it's looked up server-side rather than trusting
    // whatever d.signedByName might say.
    const [customer] = (await sql`SELECT name, email FROM customers WHERE id = ${session.customerId}`) as unknown as {
      name: string | null;
      email: string;
    }[];

    const event = await recordAttendanceEvent({
      childId: d.childId,
      eventType: d.eventType,
      sessionType: d.sessionType,
      activityId: d.activityId ?? null,
      source: 'parent_portal',
      performedByCustomerId: session.customerId,
      signatureDataUrl: d.signatureDataUrl,
      signedByName: customer?.name || customer?.email || session.email || 'Parent',
    });

    return NextResponse.json({ ok: true, occurredAt: event.occurred_at, eventType: event.event_type });
  } catch (err) {
    console.error('[api/account/attendance/check] failed', err);
    return NextResponse.json({ error: 'Could not record check-in/out.' }, { status: 500 });
  }
}
