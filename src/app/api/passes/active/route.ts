import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ pass: null });
  }

  const childName = req.nextUrl.searchParams.get('childName')?.trim();
  if (!childName) {
    return NextResponse.json({ pass: null });
  }

  try {
    await ensureSchema();
    const rows = await sql`
      SELECT id, total_sessions, sessions_used, expires_at
      FROM passes
      WHERE customer_id = ${session.customerId}
        AND status = 'paid'
        AND expires_at > now()
        AND sessions_used < total_sessions
        AND LOWER(TRIM(child_name)) = LOWER(TRIM(${childName}))
      ORDER BY expires_at ASC
      LIMIT 1
    `;
    const pass = rows[0];
    if (!pass) {
      return NextResponse.json({ pass: null });
    }
    return NextResponse.json({
      pass: {
        id: pass.id,
        sessionsRemaining: (pass.total_sessions as number) - (pass.sessions_used as number),
        expiresAt: pass.expires_at,
      },
    });
  } catch (err) {
    console.error('[api/passes/active] failed', err);
    return NextResponse.json({ pass: null });
  }
}
