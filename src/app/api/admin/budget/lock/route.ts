import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/current-staff';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';

/** "Lock" button on the Budget Tracker — clears budgetUnlocked without ending the admin session
 * itself, e.g. before handing the device to someone else in the office. */
export async function POST() {
  await requireAdmin();
  const session = await getIronSession<AdminSessionData>(await cookies(), await getSessionOptions());
  session.budgetUnlocked = false;
  await session.save();
  return NextResponse.json({ ok: true });
}
