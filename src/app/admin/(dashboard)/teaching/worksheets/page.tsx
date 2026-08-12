import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, getAssignedClasses } from '@/lib/current-staff';
import { getOccurrencesForClassesInWindow } from '@/lib/schedule';
import TeachingTabs from '@/components/admin/TeachingTabs';
import WorksheetsManager from '@/components/admin/WorksheetsManager';

export const dynamic = 'force-dynamic';

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** A rolling window centred just before today: worksheets get marked *after* a lesson, so the
 * default view leads with the recent past rather than the future (see WorksheetsManager's own
 * sort, most recent first) while still showing next week's sessions for reference. */
export default async function TeachingWorksheetsPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();

  const classOptions =
    staff.role === 'teacher'
      ? await getAssignedClasses(staff.adminUserId)
      : ((await sql`SELECT DISTINCT class_name FROM children WHERE class_name IS NOT NULL ORDER BY class_name`) as unknown as { class_name: string }[]).map((r) => r.class_name);

  const today = new Date();
  const from = dateStr(new Date(today.getTime() - 21 * 24 * 3600 * 1000));
  const to = dateStr(new Date(today.getTime() + 7 * 24 * 3600 * 1000));
  const occurrences = await getOccurrencesForClassesInWindow(classOptions, from, to);

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Teaching</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            Upload, mark, and review post-lesson worksheets for each dated session — marks feed straight into each
            student&apos;s gradebook, viewable on their Child Card and by their own parent.
          </p>
        </div>
        <TeachingTabs active="worksheets" />
      </div>
      <div className="mt-6">
        <WorksheetsManager occurrences={occurrences} />
      </div>
    </section>
  );
}
