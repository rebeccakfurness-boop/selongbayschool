import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { ensureSchema } from '@/lib/db';
import { redeemLibraryDiscountCode, DiscountCodeError } from '@/lib/library';

export async function POST(req: NextRequest) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const code = (body as { code?: string }).code;
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Enter a code.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const membership = await redeemLibraryDiscountCode(session.customerId, code);
    return NextResponse.json({ ok: true, membership });
  } catch (err) {
    if (err instanceof DiscountCodeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('[api/account/library/redeem-code] failed', err);
    return NextResponse.json({ error: 'Could not apply that code right now.' }, { status: 500 });
  }
}
