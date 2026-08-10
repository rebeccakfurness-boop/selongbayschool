'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Applies the draft "Complete online" quiz content from curriculum-enrichment-seed.ts (equipment
 * notes + starter/exit quiz questions for every Primary 1 and Primary 2 Mathematics/English
 * lesson) to whichever of those lessons already exist -- run this after "Import sample terms" has
 * created them. Matched by title, not id, so it's safe to click more than once: anything that
 * doesn't match a real lesson, or a lesson that already has quiz questions, is skipped rather than
 * erroring or duplicating. */
export default function ImportCurriculumQuizContentButton() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/curriculum/import-enrichment', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setResult(
        data.matched === 0
          ? data.note || 'Nothing new to add — already applied, or the matching lessons don’t exist yet.'
          : `Added quiz content to ${data.matched} lesson${data.matched === 1 ? '' : 's'} (${data.equipmentNotesAdded} equipment notes, ${data.questionsAdded} quiz questions)${
              data.skippedAlready ? `, skipped ${data.skippedAlready} already done` : ''
            }${data.skippedNoLesson ? `, ${data.skippedNoLesson} had no matching lesson` : ''}. Every question still needs a teacher's review before use.`
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="rounded-md border border-dashed border-orange/40 bg-orange/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Add &quot;Complete online&quot; quiz content (Primary 1–2 · Maths, English)</p>
          <p className="text-xs text-ink-soft">
            Equipment notes and starter/exit quiz questions for every lesson in those four programmes — needs
            &quot;Import sample terms&quot; to have been run first, since it matches against lessons by title.
            Explicitly a draft: review every question before students rely on it.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={importing}
          className="whitespace-nowrap rounded-full bg-orange px-4 py-2 text-sm font-bold text-white hover:bg-orange-deep disabled:opacity-50"
        >
          {importing ? 'Importing…' : 'Add quiz content'}
        </button>
      </div>
      {result && <p className="mt-2 text-xs font-semibold text-orange-deep">{result}</p>}
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
