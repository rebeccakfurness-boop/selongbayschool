'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import DocumentUploadField from '@/components/DocumentUploadField';
import type { GenerationJobRow } from '@/lib/curriculum-generation';

const selectClasses =
  'rounded-sm border border-sand-line bg-white px-4 py-2.5 font-sans text-[15px] text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30';

async function apiCall(url: string, method: string, body?: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

const STATUS_LABELS: Record<GenerationJobRow['status'], string> = {
  pending: 'Starting…',
  parsing: 'Reading the syllabus…',
  generating: 'Generating lessons…',
  completed: 'Done',
  failed: 'Failed',
};

export default function CourseBuilderForm({
  classOptions,
  subjectsByClass,
}: {
  classOptions: string[];
  subjectsByClass: Record<string, string[]>;
}) {
  const [className, setClassName] = useState(classOptions[0] ?? '');
  const [subject, setSubject] = useState(subjectsByClass[classOptions[0] ?? '']?.[0] ?? '');
  const [termLabel, setTermLabel] = useState('');
  const [examBoard, setExamBoard] = useState('');
  const [examSeries, setExamSeries] = useState('');
  const [frameworkLabel, setFrameworkLabel] = useState('');
  const [syllabusPdfUrl, setSyllabusPdfUrl] = useState<string | null>(null);
  const [workbookPdfUrl, setWorkbookPdfUrl] = useState<string | null>(null);

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<GenerationJobRow | null>(null);
  const pollingRef = useRef(false);

  function onClassChange(next: string) {
    setClassName(next);
    setSubject((current) => {
      const suggestions = subjectsByClass[next] ?? [];
      return current.trim() === '' ? (suggestions[0] ?? '') : current;
    });
  }

  async function pollUntilDone(jobId: number) {
    if (pollingRef.current) return;
    pollingRef.current = true;
    try {
      // Each /step call does exactly one unit of work (parse, or generate one topic's unit) and
      // returns -- calling it in a tight client-side loop is what actually advances the job; see
      // job-runner.ts's own comment on why this replaces a faster cron.
      for (;;) {
        const { ok, data } = await apiCall(`/api/admin/curriculum/generation-jobs/${jobId}/step`, 'POST');
        if (!ok) {
          setError((data.error as string) || 'Course generation failed.');
          return;
        }
        const nextJob = data.job as GenerationJobRow;
        setJob(nextJob);
        if (nextJob.status === 'completed' || nextJob.status === 'failed') return;
      }
    } finally {
      pollingRef.current = false;
    }
  }

  async function startGeneration() {
    setStarting(true);
    setError(null);
    const { ok, data } = await apiCall('/api/admin/curriculum/generation-jobs', 'POST', {
      className,
      subject,
      termLabel,
      examBoard,
      examSeries,
      frameworkLabel: frameworkLabel || null,
      syllabusPdfUrl,
      workbookPdfUrl: workbookPdfUrl || null,
    });
    setStarting(false);
    if (!ok) {
      setError((data.error as string) || 'Could not start course generation.');
      return;
    }
    const newJob = data.job as GenerationJobRow;
    setJob(newJob);
    pollUntilDone(newJob.id);
  }

  // Resume polling if this component re-renders (e.g. a fast refresh) while a job is mid-run and
  // its own loop hasn't started here yet.
  useEffect(() => {
    if (job && job.status !== 'completed' && job.status !== 'failed' && !pollingRef.current) {
      pollUntilDone(job.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id]);

  const canStart =
    !starting && !job && className.trim() !== '' && subject.trim() !== '' && termLabel.trim() !== '' &&
    examBoard.trim() !== '' && examSeries.trim() !== '' && syllabusPdfUrl != null;

  const running = job != null && job.status !== 'completed' && job.status !== 'failed';
  const totalUnits = job?.total_units ?? null;
  const progressPct = totalUnits ? Math.round(((job?.completed_units ?? 0) / totalUnits) * 100) : job?.status === 'parsing' ? 5 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Course details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Class" htmlFor="cb-class" required>
            <select id="cb-class" className={selectClasses} value={className} onChange={(e) => onClassChange(e.target.value)} disabled={running || job?.status === 'completed'}>
              {classOptions.length === 0 && <option value="">No classes yet</option>}
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Subject" htmlFor="cb-subject" required>
            <TextInput
              id="cb-subject"
              list="cb-subject-options"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Economics"
              disabled={running || job?.status === 'completed'}
            />
            <datalist id="cb-subject-options">
              {(subjectsByClass[className] ?? []).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <Field label="Term" htmlFor="cb-term" required>
            <TextInput
              id="cb-term"
              required
              value={termLabel}
              onChange={(e) => setTermLabel(e.target.value)}
              placeholder="e.g. Term 1 2026/27"
              disabled={running || job?.status === 'completed'}
            />
          </Field>
          <Field label="Exam board / code" htmlFor="cb-exam-board" required>
            <TextInput
              id="cb-exam-board"
              required
              value={examBoard}
              onChange={(e) => setExamBoard(e.target.value)}
              placeholder="e.g. Cambridge IGCSE 0455"
              disabled={running || job?.status === 'completed'}
            />
          </Field>
          <Field label="Exam series" htmlFor="cb-exam-series" required>
            <TextInput
              id="cb-exam-series"
              required
              value={examSeries}
              onChange={(e) => setExamSeries(e.target.value)}
              placeholder="e.g. May/June 2027"
              disabled={running || job?.status === 'completed'}
            />
          </Field>
          <Field label="Curriculum framework" htmlFor="cb-framework">
            <TextInput
              id="cb-framework"
              value={frameworkLabel}
              onChange={(e) => setFrameworkLabel(e.target.value)}
              placeholder="Optional, e.g. Cambridge International"
              disabled={running || job?.status === 'completed'}
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Syllabus PDF *</p>
            <div className="mt-1">
              <DocumentUploadField
                currentUrl={syllabusPdfUrl}
                pathPrefix="course-builder-syllabi"
                label="syllabus PDF"
                accept="application/pdf"
                onUploaded={(url) => setSyllabusPdfUrl(url)}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Workbook PDF (optional)</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              A workbook the class has already completed -- Claude proposes topics that look already mastered
              for a teacher to confirm.
            </p>
            <div className="mt-1">
              <DocumentUploadField
                currentUrl={workbookPdfUrl}
                pathPrefix="course-builder-workbooks"
                label="workbook PDF"
                accept="application/pdf"
                onUploaded={(url) => setWorkbookPdfUrl(url)}
              />
            </div>
          </div>
        </div>

        {error && <p className="mt-4 font-semibold text-orange-deep">{error}</p>}

        {!job && (
          <div className="mt-5">
            <Button type="button" variant="primary" onClick={startGeneration} disabled={!canStart}>
              {starting ? 'Starting…' : 'Generate course'}
            </Button>
          </div>
        )}
      </div>

      {job && (
        <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              {job.status === 'failed' ? '⚠ ' : ''}
              {STATUS_LABELS[job.status]}
            </h2>
            {job.status === 'completed' && job.term_id != null && (
              <Link
                href={`/admin/teaching/curriculum-plans/${job.term_id}`}
                className="rounded-full bg-teal px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-deep"
              >
                Open Planning Dashboard →
              </Link>
            )}
          </div>

          {job.status !== 'failed' && (
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-sand-line/60">
                <div
                  className={`h-full rounded-full bg-teal transition-all ${job.status === 'completed' ? 'w-full' : ''}`}
                  style={job.status === 'completed' ? undefined : { width: `${Math.max(progressPct, 4)}%` }}
                />
              </div>
              {totalUnits != null && (
                <p className="mt-1 text-xs text-ink-soft">
                  {job.completed_units} / {totalUnits} unit(s) generated · {job.completed_lessons} lesson(s) so far
                </p>
              )}
            </div>
          )}

          {job.status === 'failed' && job.error && (
            <p className="mt-2 text-sm font-semibold text-orange-deep">{job.error}</p>
          )}

          {job.progress_log.length > 0 && (
            <ul className="mt-4 flex max-h-64 flex-col gap-1 overflow-y-auto border-t border-sand-line/60 pt-3 text-xs">
              {[...job.progress_log].reverse().map((entry, i) => (
                <li key={i} className="text-ink-soft">
                  <span className="font-mono text-[10px]">{new Date(entry.at).toLocaleTimeString()}</span> — {entry.message}
                </li>
              ))}
            </ul>
          )}

          {job.workbook_mastery_signals && job.workbook_mastery_signals.length > 0 && (
            <div className="mt-4 rounded-md border border-dashed border-teal/40 bg-teal/5 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                Workbook suggests these topics may already be mastered (confirm before skipping)
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {job.workbook_mastery_signals.map((s, i) => (
                  <li key={i} className="text-xs text-ink">
                    <span className="font-semibold">[{s.confidence}]</span> {s.topicTitle} — {s.evidence}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
