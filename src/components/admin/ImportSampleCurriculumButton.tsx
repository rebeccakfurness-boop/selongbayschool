'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Imports the draft sample terms from curriculum-seed.ts -- worked examples of the Curriculum
 * Plans feature spanning Primary 1 through Primary 6 and Secondary 6 through Secondary 10 in
 * Mathematics, English and Science, plus Economics for Secondary 6 and Secondary 8 (35 programmes
 * total), explicitly labelled "(draft)" throughout so nobody mistakes them for the school's actual
 * confirmed term plans. Safe to click more than once: the import route checks first and skips any
 * programme that already exists rather than duplicating. */
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
        data.imported === 0
          ? 'Already imported. Open a programme above to review it.'
          : `Imported ${data.imported} programme${data.imported === 1 ? '' : 's'} (${data.unitsCreated} units, ${data.lessonsCreated} lessons)${
              data.skipped ? `, skipped ${data.skipped} already imported` : ''
            }. Every objective and worksheet still needs a teacher's review before use.`
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
          <p className="text-sm font-semibold text-ink">Import draft sample terms (Primary 1–6, Secondary 6–10 · Maths, English, Science, Economics)</p>
          <p className="text-xs text-ink-soft">
            Worked examples across eleven grades: 35 programmes, most drafted around the Cambridge Primary,
            Lower Secondary, and IGCSE frameworks&apos; stage-by-stage strands, plus an introductory Economics
            sequence for Secondary 6 and Secondary 8. Explicitly a draft: review every objective before
            teaching from it, and each lesson still needs its own worksheet attached.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={importing}
          className="whitespace-nowrap rounded-full bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal-deep disabled:opacity-50"
        >
          {importing ? 'Importing…' : 'Import sample terms'}
        </button>
      </div>
      {result && <p className="mt-2 text-xs font-semibold text-teal-deep">{result}</p>}
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
