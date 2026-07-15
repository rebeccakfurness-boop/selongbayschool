import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getCustomerSessionOptions, sanitizeNextPath, type CustomerSessionData } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const next = sanitizeNextPath(req.nextUrl.searchParams.get('next'), '/account/bookings');

  if (!token) {
    return NextResponse.redirect(new URL('/account/login?error=invalid', req.url));
  }

  try {
    await ensureSchema();
    const rows = await sql`
      SELECT id, email FROM customers
      WHERE magic_link_token = ${token} AND magic_link_token_expires_at > now()
    `;
    const customer = rows[0];

    if (!customer) {
      return NextResponse.redirect(new URL('/account/login?error=expired', req.url));
    }

    // Single-use: clear the token immediately so the same email link can't be replayed.
    await sql`
      UPDATE customers
      SET magic_link_token = NULL, magic_link_token_expires_at = NULL, last_login_at = now()
      WHERE id = ${customer.id}
    `;

    const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
    session.customerId = customer.id as number;
    session.email = customer.email as string;
    await session.save();

    return NextResponse.redirect(new URL(next, req.url));
  } catch (err) {
    console.error('[api/account/verify] failed', err);
    return NextResponse.redirect(new URL('/account/login?error=server', req.url));
  }
}
