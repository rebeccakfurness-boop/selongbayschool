import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { upsertLearningProfileSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();

  const { searchParams } = new URL(req.url);
  const childId = Number(searchParams.get('childId'));
  if (!Number.isInteger(childId)) {
    return NextResponse.json({ error: 'Missing or invalid childId.' }, { status: 400 });
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
    const children = await sql`SELECT class_name FROM children WHERE id = ${childId}`;
    if (children.length === 0) {
      return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, children[0].class_name as string))) {
      return NextResponse.json({ error: 'You are not assigned to this child’s class.' }, { status: 403 });
    }

    const rows = await sql`
      INSERT INTO learning_profiles (
        child_id, term_label, grade_label, general_comment, whole_days_absent, partial_days_absent,
        extra_activities, positive_attitude, respects_rights_of_others, respects_class_school_rules,
        works_well_independently, shows_initiative_enthusiasm, helps_encourages_others, created_by
      ) VALUES (
        ${childId}, ${d.termLabel}, ${d.gradeLabel ?? null}, ${d.generalComment ?? null},
        ${d.wholeDaysAbsent ?? null}, ${d.partialDaysAbsent ?? null}, ${d.extraActivities ?? null},
        ${d.positiveAttitude ?? null}, ${d.respectsRightsOfOthers ?? null}, ${d.respectsClassSchoolRules ?? null},
        ${d.worksWellIndependently ?? null}, ${d.showsInitiativeEnthusiasm ?? null}, ${d.helpsEncouragesOthers ?? null},
        ${staff.adminUserId}
      )
      RETURNING id
    `;
    const profileId = rows[0].id as number;

    let sortOrder = 0;
    for (const subject of d.subjects) {
      await sql`
        INSERT INTO learning_profile_subjects (learning_profile_id, subject_area, sub_subject, achievement, effort, teacher_comment, sort_order)
        VALUES (${profileId}, ${subject.subjectArea}, ${subject.subSubject ?? null}, ${subject.achievement ?? null}, ${subject.effort ?? null}, ${subject.teacherComment ?? null}, ${sortOrder})
      `;
      sortOrder++;
    }

    return NextResponse.json({ id: profileId });
  } catch (err) {
    console.error('[api/admin/learning-profiles] failed to create', err);
    if (err instanceof Error && err.message.includes('learning_profiles_child_id_term_label_key')) {
      return NextResponse.json({ error: 'A report for this term already exists for this child.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Could not create report.' }, { status: 500 });
  }
}
