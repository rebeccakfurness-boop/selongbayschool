import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sql } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';

export async function GET() {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());

  if (!session.customerId) {
    return NextResponse.json({ customer: null });
  }

  try {
    const rows = await sql`SELECT id, email, name, phone FROM customers WHERE id = ${session.customerId}`;
    const customer = rows[0];
    if (!customer) {
      return NextResponse.json({ customer: null });
    }
    return NextResponse.json({
      customer: { id: customer.id, email: customer.email, name: customer.name, phone: customer.phone },
    });
  } catch (err) {
    console.error('[api/account/me] failed', err);
    return NextResponse.json({ customer: null });
  }
}
