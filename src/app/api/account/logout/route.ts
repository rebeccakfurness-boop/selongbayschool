import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';

export async function POST() {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  session.destroy();
  return NextResponse.json({ ok: true });
}
