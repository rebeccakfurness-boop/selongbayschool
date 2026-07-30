import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { linkGuardianSchema } from '@/lib/validation';

/** Links a parent's customers/`/account` login to this child, creating the customers row first
 * if the parent has never booked an activity or logged in before (admin can link a guardian ahead
 * of the parent ever creating an account themselves). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) {
    return NextResponse.json({ error: 'Invalid child id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = linkGuardianSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid guardian.' }, { status: 400 });
  }
  const { email, relationship } = parsed.data;

  try {
    await ensureSchema();
    const existingChild = await sql`SELECT id FROM children WHERE id = ${childId}`;
    if (existingChild.length === 0) {
      return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
    }

    let customer = (await sql`SELECT id FROM customers WHERE email = ${email}`)[0];
    if (!customer) {
      customer = (await sql`INSERT INTO customers (email) VALUES (${email}) RETURNING id`)[0];
    }

    await sql`
      INSERT INTO guardian_children (customer_id, child_id, relationship)
      VALUES (${customer.id}, ${childId}, ${relationship ?? null})
      ON CONFLICT (customer_id, child_id) DO UPDATE SET relationship = EXCLUDED.relationship
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/children/:id/guardians] failed to link', err);
    return NextResponse.json({ error: 'Could not link guardian.' }, { status: 500 });
  }
}
