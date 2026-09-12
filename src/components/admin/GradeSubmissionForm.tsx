'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Shared by the "Answers to review" and "Worksheets to mark" pages -- POST {grade, comment(s)}
 * to whichever grading endpoint the caller names, then refresh the list. commentField lets the
 * two backends keep their own field name (teacher_comment vs comments) rather than forcing one on
 * the other. */
export default function GradeSubmissionForm({
  gradeEndpoint,
  initialGrade,
  initialComment,
  commentField,
}: {
  gradeEndpoint: string;
  initialGrade: string | null;
  initialComment: string | null;
  commentField: 'comment' | 'comments';
}) {
  const router = useRouter();
  const [grade, setGrade] = useState(initialGrade ?? '');
  const [comment, setComment] = useState(initialComment ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(gradeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: grade.trim() || null, [commentField]: comment.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save this grade.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this grade.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          placeholder="Grade (e.g. A, 8/10)"
          className="w-32 rounded-sm border border-sand-line bg-white px-2 py-1.5 text-sm"
        />
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comment for the student"
          className="min-w-[220px] flex-1 rounded-sm border border-sand-line bg-white px-2 py-1.5 text-sm"
        />
        <button type="button" onClick={save} disabled={saving} className="rounded-full bg-teal px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-deep disabled:opacity-50">
          {saving ? 'Saving…' : 'Save grade'}
        </button>
      </div>
      {error && <p className="text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
