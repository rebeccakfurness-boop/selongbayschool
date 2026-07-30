import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { updateLetterOfOfferSchema } from '@/lib/validation';
import { getLetterOfOfferById } from '@/lib/letters-of-offer';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid letter of offer id.' }, { status: 400 });
  }

  await ensureSchema();
  const letter = await getLetterOfOfferById(id);
  if (!letter) {
    return NextResponse.json({ error: 'Letter of offer not found.' }, { status: 404 });
  }
  return NextResponse.json({ letter });
}

/** Editing is blocked once a letter has been accepted — the parent agreed to specific terms, so
 * changing them afterwards without a new offer would be misleading. Admin can still view/re-send
 * the PDF; a genuinely different offer should be a new letter. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid letter of offer id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = updateLetterOfOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid letter of offer.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();

    const existing = await sql`SELECT status FROM letters_of_offer WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Letter of offer not found.' }, { status: 404 });
    }
    if (existing[0].status === 'accepted') {
      return NextResponse.json({ error: 'This letter has already been accepted and can no longer be edited.' }, { status: 409 });
    }

    await sql`
      UPDATE letters_of_offer SET
        start_date = ${d.startDate}::date,
        programme = ${d.programme ?? null},
        class_name = ${d.className ?? null},
        tuition_plan = ${d.tuitionPlan ?? null},
        fees_note = ${d.feesNote ?? null},
        additional_terms = ${d.additionalTerms ?? null},
        updated_at = now()
      WHERE id = ${id}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/letters-of-offer/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not save letter of offer.' }, { status: 500 });
  }
}
