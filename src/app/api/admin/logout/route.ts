import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';

export async function POST() {
  const session = await getIronSession<AdminSessionData>(await cookies(), await getSessionOptions());
  session.destroy();
  return NextResponse.json({ ok: true });
}
