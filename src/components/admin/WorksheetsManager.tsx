'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SessionOccurrenceRow } from '@/lib/schedule';
import { formatSchoolTime, SCHOOL_TIMEZONE_LABEL } from '@/lib/academic-calendar';
import DocumentUploadField from '@/components/DocumentUploadField';

function formatOccurrenceDateLabel(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${dateStr}T00:00:00Z`)
  );
}

interface RosterSubmissionRow {
  child_id: number;
  child_full_name: string;
  submission_id: number | null;
  file_url: string | null;
  uploaded_at: string | null;
  score: number | null;
  max_score: number | null;
}

interface RubricCriterion {
  id: number;
  label: string;
}

/** One session picker (most recent first, since marking happens after a lesson) plus a roster
 * panel for whichever session is selected — upload on a child's behalf, view what's already been
 * submitted, and mark it. Mirrors the parent/student worksheet section's shape but as a whole-class
 * roster rather than a single child's view. */
export default function WorksheetsManager({ occurrences }: { occurrences: SessionOccurrenceRow[] }) {
  // starts_at comes back from the driver as a Date object, not the "string" its TypeScript type
  // claims (every other read site just wraps it in `new Date(...)`, which happens to accept both a
  // Date and a string, hiding the mismatch) -- comparing via getTime() works regardless of which it
  // actually is, unlike calling a string-only method like localeCompare directly on it.
  const sorted = useMemo(
    () => [...occurrences].sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()),
    [occurrences]
  );
  const [selected, setSelected] = useState<SessionOccurrenceRow | null>(null);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="rounded-md border border-sand-line bg-paper p-4 shadow-soft lg:w-80 lg:shrink-0">
        <h2 className="font-display text-base font-semibold text-ink">Sessions</h2>
        {sorted.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">No sessions in this window.</p>
        ) : (
          <ul className="mt-3 flex max-h-[32rem] flex-col gap-1 overflow-y-auto">
            {sorted.map((o) => (
              <li key={o.occurrence_id}>
                <button
                  type="button"
                  onClick={() => setSelected(o)}
                  className={`w-full rounded-sm px-3 py-2 text-left text-sm transition ${
                    selected?.occurrence_id === o.occurrence_id
                      ? 'bg-teal text-white'
                      : 'hover:bg-sand/30'
                  }`}
                >
                  <div className="font-semibold">{o.subject} — {o.class_name}</div>
                  <div className={selected?.occurrence_id === o.occurrence_id ? 'text-white/80' : 'text-ink-soft'}>
                    {formatOccurrenceDateLabel(o.occurrence_date)}, {formatSchoolTime(o.starts_at)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex-1">
        {selected ? (
          <SessionRoster key={selected.occurrence_id} occurrence={selected} />
        ) : (
          <div className="rounded-md border border-dashed border-sand-line p-8 text-center text-sm text-ink-soft">
            Pick a session on the left to view or mark worksheets.
          </div>
        )}
      </div>
    </div>
  );
}

function SessionRoster({ occurrence }: { occurrence: SessionOccurrenceRow }) {
  const [roster, setRoster] = useState<RosterSubmissionRow[] | null>(null);
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [markingChildId, setMarkingChildId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/admin/worksheets?occurrenceId=${occurrence.occurrence_id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setRoster(data.roster);
        setRubricCriteria(data.rubricCriteria);
      })
      .catch(() => setError('Could not load worksheets.'));
  }, [occurrence.occurrence_id]);

  async function handleUploaded(childId: number, fileUrl: string) {
    const res = await fetch('/api/admin/worksheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ occurrenceId: occurrence.occurrence_id, childId, fileUrl }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Failed to save worksheet.');
      return;
    }
    setRoster((prev) =>
      prev
        ? prev.map((row) =>
            row.child_id === childId
              ? { ...row, submission_id: data.id, file_url: fileUrl, uploaded_at: new Date().toISOString(), score: null, max_score: null }
              : row
          )
        : prev
    );
  }

  function handleMarked(childId: number, submissionId: number, score: number, maxScore: number) {
    setRoster((prev) =>
      prev
        ? prev.map((row) => (row.child_id === childId && row.submission_id === submissionId ? { ...row, score, max_score: maxScore } : row))
        : prev
    );
    setMarkingChildId(null);
  }

  if (error) return <p className="text-sm font-semibold text-orange-deep">{error}</p>;
  if (!roster) return <p className="text-sm text-ink-soft">Loading…</p>;

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold text-teal-deep">
        {occurrence.subject} — {occurrence.class_name}
      </h2>
      <p className="text-sm text-ink-soft">
        {formatOccurrenceDateLabel(occurrence.occurrence_date)} · {formatSchoolTime(occurrence.starts_at)}–{formatSchoolTime(occurrence.ends_at)} {SCHOOL_TIMEZONE_LABEL}
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {roster.map((row) => (
          <li key={row.child_id} className="rounded-sm border border-sand-line p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-ink">{row.child_full_name}</span>
              <div className="flex items-center gap-3 text-sm">
                {row.file_url && (
                  <a href={row.file_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
                    View worksheet
                  </a>
                )}
                {row.score !== null && row.max_score !== null && (
                  <span className="font-semibold text-ink">{row.score} / {row.max_score}</span>
                )}
                {!row.file_url && (
                  <DocumentUploadField
                    currentUrl={null}
                    pathPrefix={`worksheets/${occurrence.occurrence_id}/${row.child_id}`}
                    label="worksheet"
                    onUploaded={(url) => handleUploaded(row.child_id, url)}
                    uploadEndpoint="/api/admin/lms/upload"
                  />
                )}
                {row.file_url && row.submission_id && (
                  <button
                    type="button"
                    onClick={() => setMarkingChildId(markingChildId === row.child_id ? null : row.child_id)}
                    className="font-semibold text-teal-deep hover:underline"
                  >
                    {row.score !== null ? 'Edit mark' : 'Mark'}
                  </button>
                )}
              </div>
            </div>

            {markingChildId === row.child_id && row.submission_id && (
              <MarkForm
                submissionId={row.submission_id}
                rubricCriteria={rubricCriteria}
                onSaved={(score, maxScore) => handleMarked(row.child_id, row.submission_id!, score, maxScore)}
                onCancel={() => setMarkingChildId(null)}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MarkForm({
  submissionId,
  rubricCriteria,
  onSaved,
  onCancel,
}: {
  submissionId: number;
  rubricCriteria: RubricCriterion[];
  onSaved: (score: number, maxScore: number) => void;
  onCancel: () => void;
}) {
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('10');
  const [comments, setComments] = useState('');
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const scoreNum = Number(score);
    const maxScoreNum = Number(maxScore);
    if (!Number.isFinite(scoreNum) || !Number.isFinite(maxScoreNum) || maxScoreNum <= 0) {
      setError('Enter a valid score.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/worksheets/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          score: scoreNum,
          maxScore: maxScoreNum,
          comments: comments || null,
          rubricRatings: Object.entries(ratings).map(([criterionId, rating]) => ({ criterionId: Number(criterionId), rating })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save mark');
      onSaved(scoreNum, maxScoreNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save mark');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-sand-line/60 pt-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
          Score
          <input
            type="number"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-20 rounded-sm border border-sand-line px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
          Out of
          <input
            type="number"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            className="w-20 rounded-sm border border-sand-line px-2 py-1 text-sm"
          />
        </label>
      </div>

      {rubricCriteria.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Rubric (optional)</p>
          {rubricCriteria.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <span className="w-32 text-ink-soft">{c.label}</span>
              <select
                value={ratings[c.id] ?? ''}
                onChange={(e) =>
                  setRatings((prev) => {
                    const next = { ...prev };
                    if (e.target.value === '') delete next[c.id];
                    else next[c.id] = Number(e.target.value);
                    return next;
                  })
                }
                className="rounded-sm border border-sand-line bg-white px-2 py-1 text-sm"
              >
                <option value="">Not rated</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} / 5</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
        Comments
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={2}
          className="rounded-sm border border-sand-line px-2 py-1 text-sm"
        />
      </label>

      {error && <p className="text-xs font-semibold text-orange-deep">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !score}
          className="rounded-full bg-teal px-4 py-1.5 text-sm font-bold text-white hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save mark'}
        </button>
        <button type="button" onClick={onCancel} className="text-sm font-semibold text-ink-soft hover:underline">
          Cancel
        </button>
      </div>
    </div>
  );
}
