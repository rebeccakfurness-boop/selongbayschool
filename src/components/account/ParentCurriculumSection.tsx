'use client';

import { useState } from 'react';
import type { CurriculumTerm, CurriculumTermTree, LessonProgressStatus } from '@/lib/curriculum';
import CurriculumDashboardView from '@/components/CurriculumDashboardView';

/** Fetches the full term tree client-side once a programme is picked, rather than the server
 * loading every one of a class's programmes up front — a class can have several subjects, each
 * with their own term, and only one is being looked at at a time. */
export default function ParentCurriculumSection({
  childId,
  terms,
  initialTerm,
  initialProgress,
}: {
  childId: number;
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
      const res = await fetch(`/api/account/curriculum/terms/${termId}?childId=${childId}`);
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setTermTree(data.term);
        setProgress(new Map(data.progress));
      }
    } finally {
      setLoading(false);
    }
  }

  async function setLessonProgress(lessonId: number, status: LessonProgressStatus) {
    setProgress((prev) => new Map(prev).set(lessonId, status));
    await fetch('/api/account/curriculum/progress', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId, lessonId, status }),
    });
  }

  if (terms.length === 0) return null;

  return (
    <div>
      {terms.length > 1 && (
        <div className="mb-3 flex items-center gap-2">
          <label htmlFor={`curriculum-term-${childId}`} className="text-xs font-bold uppercase tracking-wide text-ink-soft">
            Subject
          </label>
          <select
            id={`curriculum-term-${childId}`}
            value={selectedTermId ?? ''}
            onChange={(e) => selectTerm(Number(e.target.value))}
            className="rounded-sm border border-sand-line bg-white px-3 py-1.5 text-sm"
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>{t.subject}: {t.term_label}</option>
            ))}
          </select>
        </div>
      )}
      {loading && <p className="text-sm text-ink-soft">Loading…</p>}
      {!loading && termTree && (
        <CurriculumDashboardView
          term={termTree}
          progress={progress}
          canSetProgress
          onSetProgress={setLessonProgress}
          buildOnlineHref={(lessonId) => `/account/learning/lesson/${lessonId}?childId=${childId}`}
        />
      )}
    </div>
  );
}
