'use client';

import { useMemo, useState } from 'react';
import type { GradebookEntry } from '@/lib/worksheets';
import { formatDate } from '@/lib/admin-format';

/** Read-only mark history — used as-is by both the admin Child Card and the parent's own child
 * section (see account/learning), since neither side can edit from here; marking only ever happens
 * from the teacher's Worksheets tab. Subject filter covers the "by subject... over time" part of
 * the spec; term already comes bundled per-row from getGradebookForChild, so it's just displayed
 * rather than filtered separately — the date range naturally clusters by term already. */
export default function GradebookSection({ entries }: { entries: GradebookEntry[] }) {
  const subjects = useMemo(() => [...new Set(entries.map((e) => e.subject))].sort(), [entries]);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const filtered = subjectFilter === 'all' ? entries : entries.filter((e) => e.subject === subjectFilter);

  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h3 className="font-display text-base font-semibold text-ink">Gradebook</h3>
        <p className="mt-2 text-sm text-ink-soft">No marked worksheets yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-base font-semibold text-ink">Gradebook</h3>
        {subjects.length > 1 && (
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
            Subject
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="rounded-sm border border-sand-line bg-white px-2 py-1 text-sm"
            >
              <option value="all">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {filtered.map((entry) => (
          <li key={entry.occurrence_id} className="rounded-sm border border-sand-line p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-ink">
                {entry.subject}{entry.term_label ? ` · ${entry.term_label}` : ''}
              </span>
              <span className="font-semibold text-teal-deep">{entry.score} / {entry.max_score}</span>
            </div>
            <p className="mt-1 text-xs text-ink-soft">{formatDate(entry.occurrence_date)}</p>
            {entry.comments && <p className="mt-1 text-ink-soft">{entry.comments}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
