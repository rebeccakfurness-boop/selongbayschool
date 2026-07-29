import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { letterOfOfferSchema } from '@/lib/validation';
import { generateAcceptToken } from '@/lib/letters-of-offer';

export async function POST(req: NextRequest) {
  const staff = await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = letterOfOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid letter of offer.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();

    const children = await sql`SELECT id FROM children WHERE id = ${d.childId}`;
    if (children.length === 0) {
      return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
    }

    const rows = await sql`
      INSERT INTO letters_of_offer (child_id, start_date, programme, class_name, tuition_plan, fees_note, additional_terms, accept_token, created_by)
      VALUES (
        ${d.childId}, ${d.startDate}::date, ${d.programme ?? null}, ${d.className ?? null},
        ${d.tuitionPlan ?? null}, ${d.feesNote ?? null}, ${d.additionalTerms ?? null},
        ${generateAcceptToken()}, ${staff.adminUserId}
      )
      RETURNING id
    `;

    return NextResponse.json({ id: rows[0].id as number });
  } catch (err) {
    console.error('[api/admin/letters-of-offer] failed to create', err);
    return NextResponse.json({ error: 'Could not create letter of offer.' }, { status: 500 });
  }
}
