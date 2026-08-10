'use client';

import { useState } from 'react';
import type { CurriculumTerm, CurriculumTermTree, LessonProgressStatus } from '@/lib/curriculum';
import CurriculumTermBrowser from '@/components/CurriculumTermBrowser';

/** Read-only counterpart to ParentCurriculumSection — no onSetProgress, since students don't set
 * their own progress (only teachers/parents do, per the agreed scope). */
export default function StudentCurriculumSection({
  terms,
  initialTerm,
  initialProgress,
}: {
  terms: CurriculumTerm[];
  initialTerm: CurriculumTermTree | null;
  initialProgress: [number, LessonProgressStatus][];
}) {
  const [selectedTermId, setSelectedTermId] = useState(terms[0]?.id ?? null);
  const [termTree, setTermTree] = useState(initialTerm);
  const [progress, setProgress] = useState(new Map(initialProgress));
  const [loading, setLoading] = useState(false);

  async function selectTerm(termId: number) {
    setSelectedTermId(termId);
    if (termId === initialTerm?.id) {
      setTermTree(initialTerm);
      setProgress(new Map(initialProgress));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/student/curriculum/terms/${termId}`);
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setTermTree(data.term);
        setProgress(new Map(data.progress));
      }
    } finally {
      setLoading(false);
    }
  }

  if (terms.length === 0) {
    return <p className="text-sm text-ink-soft">No curriculum plan published for your class yet.</p>;
  }

  return (
    <div>
      {terms.length > 1 && (
        <div className="mb-3 flex items-center gap-2">
          <label htmlFor="student-curriculum-term" className="text-xs font-bold uppercase tracking-wide text-ink-soft">
            Subject
          </label>
          <select
            id="student-curriculum-term"
            value={selectedTermId ?? ''}
            onChange={(e) => selectTerm(Number(e.target.value))}
            className="rounded-sm border border-sand-line bg-white px-3 py-1.5 text-sm"
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>{t.subject} — {t.term_label}</option>
            ))}
          </select>
        </div>
      )}
      {loading && <p className="text-sm text-ink-soft">Loading…</p>}
      {!loading && termTree && <CurriculumTermBrowser term={termTree} progress={progress} canSetProgress={false} />}
    </div>
  );
}
