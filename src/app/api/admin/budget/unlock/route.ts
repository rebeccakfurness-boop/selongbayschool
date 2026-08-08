import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/current-staff';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';

/** Second gate on top of the normal admin login — the Budget Tracker is meant for the Principal
 * only, not every admin account, so it's a separate shared password (BUDGET_TRACKER_PASSWORD)
 * rather than a new staff role. Sets budgetUnlocked on the same admin session for its normal
 * 12-hour TTL, so it doesn't need re-entering on every page within that window. */
export async function POST(req: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const password = (body as { password?: unknown }).password;

  const expected = process.env.BUDGET_TRACKER_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: 'BUDGET_TRACKER_PASSWORD is not set in this environment yet.' }, { status: 500 });
  }
  if (typeof password !== 'string' || password !== expected) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 403 });
  }

  const session = await getIronSession<AdminSessionData>(await cookies(), await getSessionOptions());
  session.budgetUnlocked = true;
  await session.save();

  return NextResponse.json({ ok: true });
}
