import { notFound } from 'next/navigation';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import LearningProfileForm, { type LearningProfileFormData } from '@/components/admin/LearningProfileForm';
import type { SocialRating } from '@/lib/family-data';

export const dynamic = 'force-dynamic';

interface LearningProfileRow {
  term_label: string;
  grade_label: string | null;
  general_comment: string | null;
  whole_days_absent: string | null;
  partial_days_absent: string | null;
  extra_activities: string | null;
  positive_attitude: SocialRating | null;
  respects_rights_of_others: SocialRating | null;
  respects_class_school_rules: SocialRating | null;
  works_well_independently: SocialRating | null;
  shows_initiative_enthusiasm: SocialRating | null;
  helps_encourages_others: SocialRating | null;
}

export default async function EditLearningProfilePage({ params }: { params: Promise<{ id: string; profileId: string }> }) {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const { id: idParam, profileId: profileIdParam } = await params;
  const childId = Number(idParam);
  const profileId = Number(profileIdParam);
  if (!Number.isInteger(childId) || !Number.isInteger(profileId)) notFound();

  const children = await sql`SELECT class_name, child_full_name FROM children WHERE id = ${childId}`;
  const child = children[0];
  if (!child) notFound();
  if (!(await canAccessClass(staff, child.class_name as string | null))) notFound();

  const profiles = (await sql`
    SELECT * FROM learning_profiles WHERE id = ${profileId} AND child_id = ${childId}
  `) as unknown as LearningProfileRow[];
  const profile = profiles[0];
  if (!profile) notFound();

  const subjects = (await sql`
    SELECT subject_area, sub_subject, achievement, effort, teacher_comment
    FROM learning_profile_subjects WHERE learning_profile_id = ${profileId} ORDER BY sort_order
  `) as unknown as { subject_area: string; sub_subject: string | null; achievement: string | null; effort: string | null; teacher_comment: string | null }[];

  const initial: LearningProfileFormData = {
    id: profileId,
    termLabel: profile.term_label,
    gradeLabel: profile.grade_label ?? '',
    generalComment: profile.general_comment ?? '',
    wholeDaysAbsent: profile.whole_days_absent ?? '',
    partialDaysAbsent: profile.partial_days_absent ?? '',
    extraActivities: profile.extra_activities ?? '',
    positiveAttitude: profile.positive_attitude ?? '',
    respectsRightsOfOthers: profile.respects_rights_of_others ?? '',
    respectsClassSchoolRules: profile.respects_class_school_rules ?? '',
    worksWellIndependently: profile.works_well_independently ?? '',
    showsInitiativeEnthusiasm: profile.shows_initiative_enthusiasm ?? '',
    helpsEncouragesOthers: profile.helps_encourages_others ?? '',
    subjects: subjects.length
      ? subjects.map((s) => ({
          subjectArea: s.subject_area,
          subSubject: s.sub_subject ?? '',
          achievement: s.achievement ?? '',
          effort: s.effort ?? '',
          teacherComment: s.teacher_comment ?? '',
        }))
      : [],
  };

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Edit {profile.term_label} — {child.child_full_name as string}
      </h1>
      <div className="mt-6">
        <LearningProfileForm childId={childId} initial={initial} />
      </div>
    </section>
  );
}
