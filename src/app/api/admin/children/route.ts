import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { createChildSchema } from '@/lib/validation';

/** Creates a child card directly (for a family who isn't in the imported spreadsheet, or wasn't
 * captured there) — the counterpart to PATCH /api/admin/children/:id, which only ever updates an
 * existing row. */
export async function POST(req: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = createChildSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid child.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const rows = await sql`
      INSERT INTO children (
        child_full_name, child_nickname, status, is_active, programme, class_band, class_name,
        dob, gender, nationality, enrolment_date, parent1_name, parent1_relationship,
        parent1_nationality, parent2_name, parent2_relationship, parent2_nationality,
        primary_contact_email, primary_contact_phone, emergency_contact_name, emergency_contact_phone,
        allergies_medical_notes, dietary_requirements, religion, home_language
      ) VALUES (
        ${d.childFullName}, ${d.childNickname ?? null}, ${d.status ?? 'enquiry'}, ${d.isActive ?? true},
        ${d.programme ?? null}, ${d.classBand ?? null}, ${d.className ?? null},
        ${d.dob ?? null}::date, ${d.gender ?? null}, ${d.nationality ?? null}, ${d.enrolmentDate ?? null}::date,
        ${d.parent1Name ?? null}, ${d.parent1Relationship ?? null}, ${d.parent1Nationality ?? null},
        ${d.parent2Name ?? null}, ${d.parent2Relationship ?? null}, ${d.parent2Nationality ?? null},
        ${d.primaryContactEmail ?? null}, ${d.primaryContactPhone ?? null},
        ${d.emergencyContactName ?? null}, ${d.emergencyContactPhone ?? null},
        ${d.allergiesMedicalNotes ?? null}, ${d.dietaryRequirements ?? null}, ${d.religion ?? null}, ${d.homeLanguage ?? null}
      )
      RETURNING id
    `;
    return NextResponse.json({ id: rows[0].id });
  } catch (err) {
    console.error('[api/admin/children] failed to create', err);
    return NextResponse.json({ error: 'Could not create child record.' }, { status: 500 });
  }
}
