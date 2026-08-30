import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, getAssignedClasses } from '@/lib/current-staff';
import { getWeeklyScheduleForClasses, getWeeklyScheduleForClass, type ClassScheduleRow } from '@/lib/class-schedule';
import { getCurriculumTermsForClasses } from '@/lib/curriculum';
import TeachingTabs from '@/components/admin/TeachingTabs';
import ScheduleManager, { type TeacherOption, type LessonPlanOption } from '@/components/admin/ScheduleManager';
import ImportTimetableButton from '@/components/admin/ImportTimetableButton';

export const dynamic = 'force-dynamic';

export default async function ClassSchedulePage() {
  await ensureSchema();
  const staff = await getCurrentStaff();

  const classOptions =
    staff.role === 'teacher'
      ? await getAssignedClasses(staff.adminUserId)
      : ((await sql`SELECT DISTINCT class_name FROM children WHERE class_name IS NOT NULL ORDER BY class_name`) as unknown as { class_name: string }[]).map((r) => r.class_name);

  let entries: ClassScheduleRow[] = [];
  if (staff.role === 'teacher') {
    const perClass = await Promise.all(classOptions.map((c) => getWeeklyScheduleForClass(c)));
    entries = perClass.flat();
  } else {
    entries = await getWeeklyScheduleForClasses(classOptions);
  }

  const teacherOptions = (
    (await sql`SELECT id, COALESCE(display_name, email) AS label FROM admin_users WHERE is_active = true ORDER BY label`) as unknown as TeacherOption[]
  );

  const lessonPlanOptions =
    classOptions.length === 0
      ? []
      : ((await sql`
          SELECT id, class_name, title FROM lesson_plans WHERE class_name = ANY(${classOptions}) ORDER BY created_at DESC
        `) as unknown as LessonPlanOption[]);

  const curriculumTerms = (await getCurriculumTermsForClasses(classOptions)).map((t) => ({
    id: t.id,
    class_name: t.class_name,
    subject: t.subject,
  }));

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Teaching</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            The recurring weekly timetable, shown as the main screen on the parent and student portals, with
            subject, teacher, time, and whether each class is online or in person.
          </p>
        </div>
        <TeachingTabs active="schedule" />
      </div>
      {staff.role === 'admin' && (
        <div className="mt-6">
          <ImportTimetableButton />
        </div>
      )}
      <div className="mt-6">
        <ScheduleManager
          initial={entries}
          classOptions={classOptions}
          teacherOptions={teacherOptions}
          lessonPlanOptions={lessonPlanOptions}
          curriculumTerms={curriculumTerms}
          role={staff.role}
          currentAdminUserId={staff.adminUserId}
        />
      </div>
    </section>
  );
}
