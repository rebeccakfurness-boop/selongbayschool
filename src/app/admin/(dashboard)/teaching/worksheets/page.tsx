import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, getAssignedClasses } from '@/lib/current-staff';
import { getOccurrencesForClassesInWindow } from '@/lib/schedule';
import TeachingTabs from '@/components/admin/TeachingTabs';
import WorksheetsManager from '@/components/admin/WorksheetsManager';

export const dynamic = 'force-dynamic';

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Renders inline instead of throwing up to the site-wide error boundary (src/app/error.tsx),
 * which strips the real message from what reaches the browser in production — same pattern as
 * ChildCardLoadError / LearningPageLoadError elsewhere in the admin/parent portals. */
function WorksheetsPageLoadError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Teaching</h1>
      <div className="mt-6 rounded-md border border-orange-deep/40 bg-orange/10 p-5">
        <p className="font-semibold text-orange-deep">This page couldn&apos;t load.</p>
        <p className="mt-2 text-sm text-ink-soft">
          This is usually a database schema mismatch rather than something wrong with the data. Please share this
          message so it can be fixed:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-sm bg-ink/5 p-3 text-xs text-ink">{message}</pre>
      </div>
    </section>
  );
}

/** A rolling window centred just before today: worksheets get marked *after* a lesson, so the
 * default view leads with the recent past rather than the future (see WorksheetsManager's own
 * sort, most recent first) while still showing next week's sessions for reference. */
export default async function TeachingWorksheetsPage() {
  try {
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

    return renderWorksheetsPage(occurrences);
  } catch (error) {
    const digest = (error as { digest?: string } | null)?.digest;
    if (typeof digest === 'string' && (digest.startsWith('NEXT_REDIRECT') || digest.startsWith('NEXT_NOT_FOUND'))) {
      throw error;
    }
    console.error('[admin/teaching/worksheets] failed to load', error);
    return <WorksheetsPageLoadError error={error} />;
  }
}

function renderWorksheetsPage(occurrences: Awaited<ReturnType<typeof getOccurrencesForClassesInWindow>>) {
  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Teaching</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            Upload, mark, and review post-lesson worksheets for each dated session; marks feed straight into each
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
