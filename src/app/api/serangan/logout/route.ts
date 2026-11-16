import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getSeranganSessionOptions, type SeranganSessionData } from '@/lib/auth';

export async function POST() {
  const session = await getIronSession<SeranganSessionData>(await cookies(), await getSeranganSessionOptions());
  session.destroy();
  return NextResponse.json({ ok: true });
}
