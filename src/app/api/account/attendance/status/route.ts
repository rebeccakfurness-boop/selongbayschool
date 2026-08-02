import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { guardianOwnsChild } from '@/lib/lms-data';
import { getTodayEventStatus } from '@/lib/attendance';

/** Backs the activity check-in picker on /account/attendance — the daily status for every child
 * is preloaded server-side on that page, but a child's status for one specific activity is only
 * looked up once a parent actually picks that activity, since checking every child against every
 * active activity up front doesn't scale. */
export async function GET(req: NextRequest) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const childId = Number(searchParams.get('childId'));
  const activityId = Number(searchParams.get('activityId'));
  if (!Number.isInteger(childId) || !Number.isInteger(activityId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    if (!(await guardianOwnsChild(session.customerId, childId))) {
      return NextResponse.json({ error: 'Not authorized for this child.' }, { status: 403 });
    }
    const status = await getTodayEventStatus(childId, 'activity', activityId);
    return NextResponse.json({ ok: true, eventType: status?.event_type ?? null });
  } catch (err) {
    console.error('[api/account/attendance/status] failed', err);
    return NextResponse.json({ error: 'Could not load status.' }, { status: 500 });
  }
}
