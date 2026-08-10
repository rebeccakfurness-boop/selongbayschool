import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { createCurriculumTermSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = createCurriculumTermSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid term.' }, { status: 400 });
  }
  const d = parsed.data;

  if (!(await canAccessClass(staff, d.className))) {
    return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
  }

  try {
    await ensureSchema();
    const rows = await sql`
      INSERT INTO curriculum_terms (class_name, subject, term_label, framework_label)
      VALUES (${d.className}, ${d.subject}, ${d.termLabel}, ${d.frameworkLabel || null})
      RETURNING id
    `;
    return NextResponse.json({ id: rows[0].id });
  } catch (err) {
    console.error('[api/admin/curriculum/terms] failed to create', err);
    if (err instanceof Error && err.message.includes('curriculum_terms_class_name_subject_term_label_key')) {
      return NextResponse.json({ error: 'A programme for this class, subject, and term already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Could not create programme.' }, { status: 500 });
  }
}
