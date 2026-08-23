import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import TeachingTabs from '@/components/admin/TeachingTabs';
import AcademicCalendarManager, {
  type AcademicTerm,
  type AcademicCalendarException,
} from '@/components/admin/AcademicCalendarManager';

export const dynamic = 'force-dynamic';

export default async function AcademicCalendarPage() {
  await requireAdmin();
  await ensureSchema();

  const [terms, exceptions] = await Promise.all([
    sql`SELECT id, label, start_date::text, end_date::text FROM academic_terms ORDER BY start_date` as unknown as Promise<AcademicTerm[]>,
    sql`SELECT id, label, start_date::text, end_date::text, exception_type FROM academic_calendar_exceptions ORDER BY start_date` as unknown as Promise<
      AcademicCalendarException[]
    >,
  ]);

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Teaching</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            Term dates and holidays: the calendar the Weekly Schedule generates real, dated sessions against.
            Changes apply immediately: no session is ever generated on a date a holiday or closure covers.
          </p>
        </div>
        <TeachingTabs active="calendar" />
      </div>
      <div className="mt-6">
        <AcademicCalendarManager initialTerms={terms} initialExceptions={exceptions} />
      </div>
    </section>
  );
}
