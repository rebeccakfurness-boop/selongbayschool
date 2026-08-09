'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';

export interface AcademicTerm {
  id: number;
  label: string;
  start_date: string;
  end_date: string;
}

export interface AcademicCalendarException {
  id: number;
  label: string;
  start_date: string;
  end_date: string;
  exception_type: 'public_holiday' | 'school_holiday';
}

function formatDate(d: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${d}T00:00:00Z`)
  );
}

/** Drives generation for every session in the Weekly Schedule (src/lib/academic-calendar.ts):
 * no term dates means nothing generates at all, and any exception here removes the matching date
 * from every class's sessions the moment it's saved (no publish step, same as the rest of this
 * feature). Admin-only page — see /admin/teaching/calendar/page.tsx. */
export default function AcademicCalendarManager({
  initialTerms,
  initialExceptions,
}: {
  initialTerms: AcademicTerm[];
  initialExceptions: AcademicCalendarException[];
}) {
  const router = useRouter();
  const [terms, setTerms] = useState(initialTerms);
  const [exceptions, setExceptions] = useState(initialExceptions);
  const [error, setError] = useState<string | null>(null);

  const [termLabel, setTermLabel] = useState('');
  const [termStart, setTermStart] = useState('');
  const [termEnd, setTermEnd] = useState('');
  const [savingTerm, setSavingTerm] = useState(false);

  const [excLabel, setExcLabel] = useState('');
  const [excStart, setExcStart] = useState('');
  const [excEnd, setExcEnd] = useState('');
  const [excType, setExcType] = useState<'public_holiday' | 'school_holiday'>('school_holiday');
  const [savingExc, setSavingExc] = useState(false);

  async function addTerm() {
    setSavingTerm(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/academic-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: termLabel, startDate: termStart, endDate: termEnd }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to add term');
      setTerms((prev) => [...prev, { id: data.id, label: termLabel, start_date: termStart, end_date: termEnd }]);
      setTermLabel('');
      setTermStart('');
      setTermEnd('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add term');
    } finally {
      setSavingTerm(false);
    }
  }

  async function removeTerm(id: number) {
    setTerms((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/admin/academic-terms/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  async function addException() {
    setSavingExc(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/academic-calendar-exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: excLabel, startDate: excStart, endDate: excEnd, exceptionType: excType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to add exception');
      setExceptions((prev) => [...prev, { id: data.id, label: excLabel, start_date: excStart, end_date: excEnd, exception_type: excType }]);
      setExcLabel('');
      setExcStart('');
      setExcEnd('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add exception');
    } finally {
      setSavingExc(false);
    }
  }

  async function removeException(id: number) {
    setExceptions((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/admin/academic-calendar-exceptions/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  const sortedTerms = [...terms].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const sortedExceptions = [...exceptions].sort((a, b) => a.start_date.localeCompare(b.start_date));

  return (
    <div className="flex flex-col gap-8">
      {error && <p className="font-semibold text-orange-deep">{error}</p>}

      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Terms</h2>
        <p className="mt-1 text-xs text-ink-soft">
          The date ranges the Weekly Schedule generates real sessions against. No terms means nothing generates.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {sortedTerms.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-sand-line bg-paper px-3 py-2 text-sm">
              <span>
                <span className="font-semibold text-ink">{t.label}</span>
                <span className="ml-2 text-ink-soft">{formatDate(t.start_date)} – {formatDate(t.end_date)}</span>
              </span>
              <button type="button" onClick={() => removeTerm(t.id)} className="text-xs font-semibold text-orange-deep hover:underline">
                Remove
              </button>
            </div>
          ))}
          {sortedTerms.length === 0 && (
            <div className="rounded-md border border-dashed border-sand-line p-4 text-center text-sm text-ink-soft">
              No terms set up yet — the Weekly Schedule won&apos;t generate any sessions until at least one is added.
            </div>
          )}
        </div>
        <div className="mt-4 grid gap-3 rounded-md border border-sand-line bg-paper p-4 sm:grid-cols-4">
          <Field label="Label" htmlFor="term-label" required>
            <TextInput id="term-label" value={termLabel} onChange={(e) => setTermLabel(e.target.value)} placeholder="e.g. Term 1 2026/27" />
          </Field>
          <Field label="Start date" htmlFor="term-start" required>
            <TextInput id="term-start" type="date" value={termStart} onChange={(e) => setTermStart(e.target.value)} />
          </Field>
          <Field label="End date" htmlFor="term-end" required>
            <TextInput id="term-end" type="date" value={termEnd} onChange={(e) => setTermEnd(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <Button type="button" variant="primary" onClick={addTerm} disabled={savingTerm || !termLabel.trim() || !termStart || !termEnd}>
              {savingTerm ? 'Saving…' : 'Add term'}
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Holidays &amp; exceptions</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Public holidays and school closures — no sessions are generated on any date these cover. Review the
          seeded rows below marked &quot;(unconfirmed)&quot; against the school&apos;s official calendar and correct
          or remove any that are wrong.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {sortedExceptions.map((exc) => (
            <div key={exc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-sand-line bg-paper px-3 py-2 text-sm">
              <span>
                <span className="font-semibold text-ink">{exc.label}</span>
                <span className="ml-2 text-ink-soft">{formatDate(exc.start_date)} – {formatDate(exc.end_date)}</span>
                <span
                  className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    exc.exception_type === 'public_holiday' ? 'bg-orange/20 text-orange-deep' : 'bg-teal/15 text-teal-deep'
                  }`}
                >
                  {exc.exception_type === 'public_holiday' ? 'Public holiday' : 'School holiday'}
                </span>
              </span>
              <button type="button" onClick={() => removeException(exc.id)} className="text-xs font-semibold text-orange-deep hover:underline">
                Remove
              </button>
            </div>
          ))}
          {sortedExceptions.length === 0 && (
            <div className="rounded-md border border-dashed border-sand-line p-4 text-center text-sm text-ink-soft">
              No holidays or exceptions set up yet.
            </div>
          )}
        </div>
        <div className="mt-4 grid gap-3 rounded-md border border-sand-line bg-paper p-4 sm:grid-cols-5">
          <Field label="Label" htmlFor="exc-label" required>
            <TextInput id="exc-label" value={excLabel} onChange={(e) => setExcLabel(e.target.value)} placeholder="e.g. Independence Day" />
          </Field>
          <Field label="Start date" htmlFor="exc-start" required>
            <TextInput id="exc-start" type="date" value={excStart} onChange={(e) => setExcStart(e.target.value)} />
          </Field>
          <Field label="End date" htmlFor="exc-end" required>
            <TextInput id="exc-end" type="date" value={excEnd} onChange={(e) => setExcEnd(e.target.value)} />
          </Field>
          <Field label="Type" htmlFor="exc-type" required>
            <select
              id="exc-type"
              value={excType}
              onChange={(e) => setExcType(e.target.value as 'public_holiday' | 'school_holiday')}
              className="w-full rounded-sm border border-sand-line bg-white px-3 py-2 text-sm"
            >
              <option value="school_holiday">School holiday</option>
              <option value="public_holiday">Public holiday</option>
            </select>
          </Field>
          <div className="flex items-end">
            <Button type="button" variant="primary" onClick={addException} disabled={savingExc || !excLabel.trim() || !excStart || !excEnd}>
              {savingExc ? 'Saving…' : 'Add'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
