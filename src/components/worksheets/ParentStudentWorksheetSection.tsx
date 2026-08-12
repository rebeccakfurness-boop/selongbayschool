'use client';

import { useEffect, useState } from 'react';
import DocumentUploadField from '@/components/DocumentUploadField';

interface RubricScore {
  criterion_id: number;
  label: string;
  rating: number;
}

interface WorksheetDetail {
  submission_id: number;
  file_url: string;
  uploaded_at: string;
  uploaded_by_role: 'admin' | 'parent' | 'student' | null;
  mark: { score: number; max_score: number; comments: string | null; marked_at: string; rubric: RubricScore[] } | null;
}

/** Shown inside the same session-detail modal parents and students already use to see time/Meet
 * link — viewing works regardless of format (a teacher may have uploaded on-site work on the
 * child's behalf), but the upload control only appears for online sessions with no mark yet, per
 * the agreed default (teacher handles on-site sessions) and to avoid silently erasing an existing
 * grade with a careless re-upload. */
export default function ParentStudentWorksheetSection({
  occurrenceId,
  childId,
  role,
  canUpload,
}: {
  occurrenceId: number;
  childId: number;
  role: 'parent' | 'student';
  canUpload: boolean;
}) {
  const [worksheet, setWorksheet] = useState<WorksheetDetail | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const fetchUrl =
    role === 'parent'
      ? `/api/account/worksheets?occurrenceId=${occurrenceId}&childId=${childId}`
      : `/api/student/worksheets?occurrenceId=${occurrenceId}`;
  const saveUrl = role === 'parent' ? '/api/account/worksheets' : '/api/student/worksheets';
  const uploadEndpoint = role === 'parent' ? `/api/account/children/${childId}/upload?kind=document` : '/api/student/upload';

  useEffect(() => {
    let cancelled = false;
    fetch(fetchUrl)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setWorksheet(data.worksheet ?? null);
      })
      .catch(() => {
        if (!cancelled) setWorksheet(null);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchUrl]);

  async function handleUploaded(fileUrl: string) {
    setError(null);
    const body: Record<string, unknown> = { occurrenceId, fileUrl };
    if (role === 'parent') body.childId = childId;
    const res = await fetch(saveUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Failed to save worksheet.');
      return;
    }
    const fresh = await fetch(fetchUrl)
      .then((r) => r.json())
      .catch(() => null);
    setWorksheet(fresh?.worksheet ?? null);
  }

  if (worksheet === undefined) return null;

  return (
    <div className="mt-4 border-t border-sand-line/60 pt-4">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Worksheet</p>

      {worksheet?.file_url && (
        <a
          href={worksheet.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-sm font-semibold text-teal-deep underline"
        >
          View uploaded worksheet
        </a>
      )}
      {!worksheet?.file_url && <p className="mt-1 text-sm text-ink-soft">No worksheet uploaded yet.</p>}

      {worksheet?.mark && (
        <div className="mt-2 rounded-sm bg-sand/20 p-3 text-sm">
          <p className="font-semibold text-ink">
            Mark: {worksheet.mark.score} / {worksheet.mark.max_score}
          </p>
          {worksheet.mark.comments && <p className="mt-1 text-ink-soft">{worksheet.mark.comments}</p>}
          {worksheet.mark.rubric.length > 0 && (
            <ul className="mt-2 flex flex-col gap-0.5 text-xs text-ink-soft">
              {worksheet.mark.rubric.map((r) => (
                <li key={r.criterion_id}>
                  {r.label}: {r.rating} / 5
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {canUpload && !worksheet?.mark && (
        <div className="mt-3">
          <DocumentUploadField
            currentUrl={worksheet?.file_url ?? null}
            pathPrefix={`children/${childId}/worksheets/${occurrenceId}`}
            label="worksheet"
            onUploaded={handleUploaded}
            uploadEndpoint={uploadEndpoint}
          />
        </div>
      )}
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
