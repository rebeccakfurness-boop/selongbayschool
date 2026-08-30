import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import TeachingTabs from '@/components/admin/TeachingTabs';
import AcademicCalendarGrid from '@/components/admin/AcademicCalendarGrid';
import AcademicCalendarManager, {
  type AcademicTerm,
  type AcademicCalendarException,
} from '@/components/admin/AcademicCalendarManager';

export const dynamic = 'force-dynamic';

export default async function AcademicCalendarPage() {
  const staff = await getCurrentStaff();
  const isAdmin = staff.role === 'admin';
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
          <h1 className="font-display text-2xl font-semibold text-ink">Academic Calendar</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            Term dates and holidays: the calendar the Weekly Schedule generates real, dated sessions against.
            {isAdmin && ' Changes apply immediately: no session is ever generated on a date a holiday or closure covers.'}
          </p>
        </div>
        <TeachingTabs active="calendar" />
      </div>
      <div className="mt-6">
        <AcademicCalendarGrid terms={terms} exceptions={exceptions} />
      </div>
      {isAdmin && (
        <div className="mt-10 border-t border-sand-line pt-8">
          <AcademicCalendarManager initialTerms={terms} initialExceptions={exceptions} />
        </div>
      )}
    </section>
  );
}
