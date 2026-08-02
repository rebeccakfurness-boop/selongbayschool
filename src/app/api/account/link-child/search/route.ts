import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { linkChildSearchSchema } from '@/lib/validation';

interface ChildMatch {
  id: number;
  child_full_name: string;
  class_name: string | null;
  link_status: 'approved' | 'pending' | 'rejected' | null;
}

/** Requires both full name AND exact date of birth to match — a name-only search would let any
 * parent browse the whole student roster, which is exactly the kind of open self-link this
 * approval flow (see guardian_children.status) exists to prevent. */
export async function POST(req: NextRequest) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = linkChildSearchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid search.' }, { status: 400 });
  }
  const { childFullName, dob } = parsed.data;

  try {
    await ensureSchema();
    const rows = (await sql`
      SELECT c.id, c.child_full_name, c.class_name, gc.status AS link_status
      FROM children c
      LEFT JOIN guardian_children gc ON gc.child_id = c.id AND gc.customer_id = ${session.customerId}
      WHERE c.is_active = true AND c.child_full_name ILIKE '%' || ${childFullName} || '%' AND c.dob = ${dob}::date
      ORDER BY c.child_full_name
      LIMIT 10
    `) as unknown as ChildMatch[];

    return NextResponse.json({ ok: true, matches: rows });
  } catch (err) {
    console.error('[api/account/link-child/search] failed', err);
    return NextResponse.json({ error: 'Could not search right now.' }, { status: 500 });
  }
}
