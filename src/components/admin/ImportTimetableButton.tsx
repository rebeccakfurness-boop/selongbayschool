'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** One-time bulk-load of the real school timetable extracted from the spreadsheet the school
 * provided — see src/lib/class-schedule-seed.ts. Safe to click more than once (the import route
 * skips anything already present), so this stays a plain button rather than needing a confirm
 * dialog or a "used" flag. */
export default function ImportTimetableButton() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/class-schedule/import', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setResult(`Added ${data.inserted} slot${data.inserted === 1 ? '' : 's'}${data.skipped ? ` (${data.skipped} already there, skipped)` : ''}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="rounded-md border border-dashed border-teal/40 bg-teal/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Import the school timetable</p>
          <p className="text-xs text-ink-soft">
            Loads Primary, Secondary, and Early Years &amp; Kindergarten from the spreadsheet the school provided.
            Safe to click again: it skips anything already added, and won&apos;t duplicate.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={importing}
          className="whitespace-nowrap rounded-full bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal-deep disabled:opacity-50"
        >
          {importing ? 'Importing…' : 'Import timetable'}
        </button>
      </div>
      {result && <p className="mt-2 text-xs font-semibold text-teal-deep">{result}</p>}
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
