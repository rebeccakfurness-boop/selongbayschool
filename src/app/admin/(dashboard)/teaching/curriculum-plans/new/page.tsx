import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, getAssignedClasses } from '@/lib/current-staff';
import { getWeeklyScheduleForClasses } from '@/lib/class-schedule';
import CourseBuilderForm from '@/components/admin/CourseBuilderForm';

export const dynamic = 'force-dynamic';

export default async function NewCoursePage() {
  await ensureSchema();
  const staff = await getCurrentStaff();

  const classOptions =
    staff.role === 'teacher'
      ? await getAssignedClasses(staff.adminUserId)
      : ((await sql`SELECT DISTINCT class_name FROM children WHERE class_name IS NOT NULL ORDER BY class_name`) as unknown as { class_name: string }[]).map(
          (r) => r.class_name
        );

  // What subject(s) a class's real timetable already has -- pre-fills the Course Builder's
  // subject field once a class is picked, same "read the real timetable rather than ask twice"
  // precedent as computeLessonPacing itself.
  const schedule = await getWeeklyScheduleForClasses(classOptions);
  const subjectsByClass: Record<string, string[]> = {};
  for (const row of schedule) {
    const list = (subjectsByClass[row.class_name] ??= []);
    if (!list.includes(row.subject)) list.push(row.subject);
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Generate a new course</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            Upload a syllabus (and, optionally, a workbook already completed) and Claude will build a full
            pacing plan and every lesson&apos;s content against this class&apos;s real timetable and academic
            calendar. Every generated lesson lands as &quot;Needs review&quot; -- nothing is visible to parents
            or students until a teacher publishes it.
          </p>
        </div>
        <Link href="/admin/teaching/curriculum-plans" className="text-sm font-semibold text-teal-deep hover:underline">
          ← Back to Curriculum Plans
        </Link>
      </div>

      <div className="mt-4 rounded-md border-2 border-orange-deep bg-orange/15 p-4">
        <p className="text-sm font-bold text-orange-deep">
          ⚠️ This uses the Anthropic API and will incur a real cost per generation.
        </p>
        <p className="mt-1 text-sm text-orange-deep">
          Do not use unless you&apos;ve explicitly set up billing and understand the cost. Every course run here
          calls a paid LLM once per topic, plus once for the syllabus and (if given) the workbook. If you already
          have a fully written-out course as JSON, use{' '}
          <Link href="/admin/teaching/curriculum-plans/import" className="font-bold underline">
            Import a pre-written course
          </Link>{' '}
          instead -- it runs the identical pipeline for free.
        </p>
      </div>

      <div className="mt-6">
        <CourseBuilderForm classOptions={classOptions} subjectsByClass={subjectsByClass} />
      </div>
    </section>
  );
}
