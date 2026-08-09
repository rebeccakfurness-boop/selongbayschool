import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { guardianOwnsChild } from '@/lib/lms-data';
import { setScheduleNotificationPrefSchema } from '@/lib/validation';
import { setNotificationPref } from '@/lib/schedule';

/** Not covered by src/proxy.ts's matcher (/api/account/:path* isn't listed there, same as the
 * lunch-order routes), so the session and per-child ownership are both checked directly here. */
export async function PATCH(req: NextRequest) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in to update notification preferences.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = setScheduleNotificationPrefSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    if (!(await guardianOwnsChild(session.customerId, parsed.data.childId))) {
      return NextResponse.json({ error: 'Not authorized for this child.' }, { status: 403 });
    }
    await setNotificationPref(session.customerId, parsed.data.childId, parsed.data.enabled);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/account/schedule/notification-prefs] failed', err);
    return NextResponse.json({ error: 'Could not save that preference.' }, { status: 500 });
  }
}
