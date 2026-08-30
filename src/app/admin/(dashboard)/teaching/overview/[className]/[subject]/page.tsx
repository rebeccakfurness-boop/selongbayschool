import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { getYearOverview } from '@/lib/curriculum';
import { formatDate } from '@/lib/admin-format';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

/** A parent-facing, one-page "year at a glance" for one class + subject: unit titles per term
 * (never individual lessons), the strand/skill areas covered, and a termly timeline -- built for
 * printing/saving as a PDF a teacher sends home, not for browsing on-screen. Landscape A4 so three
 * terms sit side by side; see WORKSHEET_CSS/the single-lesson print routes for the same
 * real-page-not-an-iframe print approach this follows. */
export default async function YearOverviewPage({ params }: { params: Promise<{ className: string; subject: string }> }) {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const { className: classNameParam, subject: subjectParam } = await params;
  const className = decodeURIComponent(classNameParam);
  const subject = decodeURIComponent(subjectParam);

  if (!(await canAccessClass(staff, className))) {
    return (
      <section className="p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Not available</h1>
        <p className="mt-2 text-sm text-ink-soft">You are not assigned to {className}.</p>
      </section>
    );
  }

  const overview = await getYearOverview(className, subject);
  if (!overview || overview.terms.every((t) => t.units.length === 0)) {
    return (
      <section className="p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Nothing to show yet</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {className} / {subject} has no units yet, so there&apos;s no year overview to build.
        </p>
      </section>
    );
  }

  const allDates = overview.terms.flatMap((t) => [t.startDate, t.endDate]).filter((d): d is string => Boolean(d));
  const yearLabel =
    allDates.length > 0
      ? (() => {
          const years = [...new Set(allDates.map((d) => d.slice(0, 4)))].sort();
          return years.length > 1 ? `${years[0]}/${years[years.length - 1].slice(2)}` : years[0];
        })()
      : '';

  return (
    <div className="mx-auto max-w-[1050px] p-8 print:p-0">
      <style>{'@page { size: A4 landscape; margin: 12mm; }'}</style>
      <div className="mb-6 flex items-center justify-end print:hidden">
        <PrintButton label="Print / save as PDF" />
      </div>

      <div className="overflow-hidden rounded-md border border-sand-line">
        <div className="bg-teal-deep px-8 py-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/70">Year overview{yearLabel ? ` · ${yearLabel}` : ''}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            {className} · {subject}
          </h1>
          {overview.frameworkLabel && <p className="mt-1 text-sm text-white/80">{overview.frameworkLabel}</p>}
        </div>

        <div className="bg-paper p-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {overview.terms.map((term) => (
              <div key={term.termId} className="rounded-md border border-sand-line p-4" style={{ breakInside: 'avoid' }}>
                <div className="flex items-baseline justify-between gap-2 border-b border-sand-line pb-2">
                  <h2 className="font-display text-base font-semibold text-teal-deep">{term.termLabel}</h2>
                  {term.startDate && term.endDate && (
                    <span className="whitespace-nowrap text-[11px] font-semibold text-ink-soft">
                      {formatDate(term.startDate)} – {formatDate(term.endDate)}
                    </span>
                  )}
                </div>
                <ol className="mt-2.5 flex flex-col gap-1.5">
                  {term.units.map((unit, i) => (
                    <li key={unit.title} className="flex items-baseline gap-2 text-[12.5px] leading-snug text-ink">
                      <span className="font-mono text-[11px] text-ink-soft">{i + 1}.</span>
                      <span>{unit.title.replace(/^Unit \d+:\s*/, '')}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          {overview.strands.length > 0 && (
            <div className="mt-6 border-t border-sand-line pt-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-ink-soft">What they&apos;ll learn</h2>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {overview.strands.map((s) => (
                  <span key={s.title} className="rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal-deep">
                    {s.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {overview.ongoingCard && (
            <div className="mt-5 rounded-md border border-orange/30 bg-orange/5 p-4">
              <h2 className="font-display text-sm font-semibold text-orange-deep">{overview.ongoingCard.title}</h2>
              <p className="mt-1 text-xs text-ink-soft">{overview.ongoingCard.blurb}</p>
            </div>
          )}

          <p className="mt-6 text-center text-[11px] text-ink-soft">Selong Bay School · {className} {subject} · updated {formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    </div>
  );
}
