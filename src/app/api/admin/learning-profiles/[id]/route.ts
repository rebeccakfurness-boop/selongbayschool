import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { upsertLearningProfileSchema } from '@/lib/validation';

async function loadProfileClass(id: number) {
  return (await sql`
    SELECT c.class_name FROM learning_profiles lp JOIN children c ON c.id = lp.child_id WHERE lp.id = ${id}
  `) as unknown as { class_name: string | null }[];
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid report id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = upsertLearningProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid report.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const existing = await loadProfileClass(id);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, existing[0].class_name))) {
      return NextResponse.json({ error: 'You are not assigned to this child’s class.' }, { status: 403 });
    }

    await sql`
      UPDATE learning_profiles SET
        term_label = ${d.termLabel},
        grade_label = ${d.gradeLabel ?? null},
        general_comment = ${d.generalComment ?? null},
        whole_days_absent = ${d.wholeDaysAbsent ?? null},
        partial_days_absent = ${d.partialDaysAbsent ?? null},
        extra_activities = ${d.extraActivities ?? null},
        positive_attitude = ${d.positiveAttitude ?? null},
        respects_rights_of_others = ${d.respectsRightsOfOthers ?? null},
        respects_class_school_rules = ${d.respectsClassSchoolRules ?? null},
        works_well_independently = ${d.worksWellIndependently ?? null},
        shows_initiative_enthusiasm = ${d.showsInitiativeEnthusiasm ?? null},
        helps_encourages_others = ${d.helpsEncouragesOthers ?? null},
        updated_at = now()
      WHERE id = ${id}
    `;

    await sql`DELETE FROM learning_profile_subjects WHERE learning_profile_id = ${id}`;
    let sortOrder = 0;
    for (const subject of d.subjects) {
      await sql`
        INSERT INTO learning_profile_subjects (learning_profile_id, subject_area, sub_subject, achievement, effort, teacher_comment, sort_order)
        VALUES (${id}, ${subject.subjectArea}, ${subject.subSubject ?? null}, ${subject.achievement ?? null}, ${subject.effort ?? null}, ${subject.teacherComment ?? null}, ${sortOrder})
      `;
      sortOrder++;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/learning-profiles/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not save report.' }, { status: 500 });
  }
}
