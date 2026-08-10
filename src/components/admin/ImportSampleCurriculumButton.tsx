'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Imports the draft Primary 1 Mathematics term from curriculum-seed.ts -- a worked example of
 * the Curriculum Plans feature, explicitly labelled "(draft)" throughout so nobody mistakes it
 * for the school's actual confirmed term plan. Safe to click more than once: the import route
 * checks first and reports back rather than duplicating. */
export default function ImportSampleCurriculumButton() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/curriculum/import-sample-term', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setResult(
        data.alreadyImported
          ? 'Already imported — open Primary 1 · Mathematics · Term 1 (draft) above to review it.'
          : `Imported ${data.unitsCreated} units and ${data.lessonsCreated} lessons. Every objective and worksheet still needs a teacher's review before use.`
      );
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
          <p className="text-sm font-semibold text-ink">Import a draft sample term (Primary 1 · Mathematics)</p>
          <p className="text-xs text-ink-soft">
            A worked example — 7 units, ~22 lessons, drafted around the Cambridge Primary Mathematics Stage 1
            framework strands. Explicitly a draft: review every objective before teaching from it, and each
            lesson still needs its own worksheet attached.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={importing}
          className="whitespace-nowrap rounded-full bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal-deep disabled:opacity-50"
        >
          {importing ? 'Importing…' : 'Import sample term'}
        </button>
      </div>
      {result && <p className="mt-2 text-xs font-semibold text-teal-deep">{result}</p>}
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
