import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getAcademicTerms, getTermCalendarDays } from '@/lib/term-attendance-report';
import { formatDate } from '@/lib/admin-format';

export const dynamic = 'force-dynamic';

/** Picks the term whose date range covers today, falling back to the most recently-started term
 * when today falls outside every configured term (school holidays, or terms not fully set up yet)
 * -- a sensible default rather than leaving the first-ever term selected forever. */
function defaultTermId(terms: { id: number; start_date: string; end_date: string }[]): number | null {
  if (terms.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  const current = terms.find((t) => today >= t.start_date && today <= t.end_date);
  if (current) return current.id;
  const past = terms.filter((t) => t.start_date <= today);
  return (past[past.length - 1] ?? terms[0]).id;
}

export default async function TermAttendanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ termId?: string; class?: string }>;
}) {
  await requireAdmin();
  await ensureSchema();

  const params = await searchParams;
  const [terms, classOptions] = await Promise.all([
    getAcademicTerms(),
    sql`SELECT DISTINCT class_name FROM children WHERE class_name IS NOT NULL ORDER BY class_name` as unknown as Promise<{ class_name: string }[]>,
  ]);

  const termId = params.termId ? Number(params.termId) : defaultTermId(terms);
  const classFilter = params.class || '';
  const selectedTerm = terms.find((t) => t.id === termId) ?? null;
  const calendar = selectedTerm ? await getTermCalendarDays(selectedTerm.id) : null;

  const schoolDays = calendar?.days.filter((d) => d.status === 'school_day').length ?? 0;
  const publicHolidays = calendar?.days.filter((d) => d.status === 'public_holiday').length ?? 0;
  const schoolHolidays = calendar?.days.filter((d) => d.status === 'school_holiday').length ?? 0;

  const downloadHref = selectedTerm
    ? `/api/admin/attendance/term-report?termId=${selectedTerm.id}${classFilter ? `&class=${encodeURIComponent(classFilter)}` : ''}`
    : null;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Term Attendance Register</h1>
          <p className="mt-1 text-sm text-ink-soft">
            One spreadsheet, students and staff on separate sheets, checked day-by-day against the Academic Calendar --
            for end-of-term reporting.
          </p>
        </div>
        <Link href="/admin/attendance" className="text-sm font-semibold text-teal-deep hover:underline">
          Back to Attendance
        </Link>
      </div>

      {terms.length === 0 ? (
        <div className="mt-6 rounded-md border border-dashed border-sand-line bg-paper p-6 text-sm text-ink-soft">
          No terms are set up yet. Add one from <Link href="/admin/teaching/schedule" className="font-semibold text-teal-deep underline">Teaching &rarr; Schedule</Link> before a
          register can be built.
        </div>
      ) : (
        <>
          <form method="get" className="mt-4 flex flex-wrap items-end gap-3 rounded-md border border-sand-line bg-paper p-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="tar-term" className="text-xs font-bold text-ink-soft">Term</label>
              <select id="tar-term" name="termId" defaultValue={selectedTerm?.id ?? ''} className="rounded-sm border border-sand-line bg-white px-3 py-2 text-sm text-ink">
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} ({formatDate(t.start_date)} &ndash; {formatDate(t.end_date)})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="tar-class" className="text-xs font-bold text-ink-soft">Student class (optional)</label>
              <select id="tar-class" name="class" defaultValue={classFilter} className="rounded-sm border border-sand-line bg-white px-3 py-2 text-sm text-ink">
                <option value="">All classes</option>
                {classOptions.map((c) => (
                  <option key={c.class_name} value={c.class_name}>{c.class_name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="rounded-full bg-teal px-5 py-2 text-sm font-bold text-white hover:bg-teal-deep">
              Update preview
            </button>
          </form>

          {selectedTerm && calendar && (
            <div className="mt-6 rounded-md border border-sand-line bg-paper p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold text-ink">{selectedTerm.label}</h2>
              <p className="mt-1 text-sm text-ink-soft">
                {formatDate(selectedTerm.start_date)} &ndash; {formatDate(selectedTerm.end_date)}
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-sm border border-sand-line bg-white p-4 text-center">
                  <p className="font-display text-2xl font-bold text-teal-deep">{schoolDays}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">School days</p>
                </div>
                <div className="rounded-sm border border-sand-line bg-white p-4 text-center">
                  <p className="font-display text-2xl font-bold text-orange-deep">{publicHolidays}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Public holidays</p>
                </div>
                <div className="rounded-sm border border-sand-line bg-white p-4 text-center">
                  <p className="font-display text-2xl font-bold text-ink-soft">{schoolHolidays}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">School holiday days</p>
                </div>
              </div>

              {(publicHolidays > 0 || schoolHolidays > 0) && (
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Closed this term</p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {calendar.days
                      .filter((d) => d.status !== 'school_day')
                      .reduce<{ label: string; type: string; from: string; to: string }[]>((acc, d) => {
                        const last = acc[acc.length - 1];
                        if (last && last.label === d.label && last.type === d.status) {
                          last.to = d.date;
                          return acc;
                        }
                        acc.push({ label: d.label ?? '', type: d.status, from: d.date, to: d.date });
                        return acc;
                      }, [])
                      .map((period, i) => (
                        <li key={i} className="text-sm text-ink-soft">
                          <span className="font-semibold text-ink">{period.label}</span>{' '}
                          ({period.type === 'public_holiday' ? 'Public holiday' : 'School holiday'}) --{' '}
                          {period.from === period.to ? formatDate(period.from) : `${formatDate(period.from)} to ${formatDate(period.to)}`}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              <p className="mt-4 text-xs text-ink-soft">
                The downloaded spreadsheet marks each of the {schoolDays} school days above as Present/Absent per
                student and staff member, and labels every closed day with its own holiday name instead of leaving it
                blank -- weekends aren&apos;t included as columns at all, since they&apos;re never school days here.
              </p>

              {downloadHref && (
                <a
                  href={downloadHref}
                  className="mt-5 inline-block rounded-full bg-teal px-6 py-2.5 text-sm font-bold text-white hover:bg-teal-deep"
                >
                  Download Register (.xlsx)
                </a>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
