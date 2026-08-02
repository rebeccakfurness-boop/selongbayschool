import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getKioskSessionOptions, type KioskSessionData } from '@/lib/auth';

/** Manually re-locks this tablet's browser — the "Lock kiosk" link on the kiosk screen footer. */
export async function POST() {
  const session = await getIronSession<KioskSessionData>(await cookies(), await getKioskSessionOptions());
  session.destroy();
  return NextResponse.json({ ok: true });
}
