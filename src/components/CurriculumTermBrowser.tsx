'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CurriculumTermTree, CurriculumLesson, LessonProgressStatus } from '@/lib/curriculum';

const STATUS_LABEL: Record<LessonProgressStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

const STATUS_DOT: Record<LessonProgressStatus, string> = {
  not_started: 'bg-ink-soft/30',
  in_progress: 'bg-orange',
  completed: 'bg-teal',
};

function StatusBadge({ status }: { status: LessonProgressStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

interface Props {
  term: CurriculumTermTree;
  /** lessonId -> status for the child currently being viewed. Missing entries default to
   * 'not_started' -- there's no row in the database until someone touches that lesson. */
  progress: Map<number, LessonProgressStatus>;
  /** Parents (their own child) and teachers/admin can update progress, per the agreed scope;
   * students see it read-only, same as every other student-facing view in this app. */
  canSetProgress: boolean;
  onSetProgress?: (lessonId: number, status: LessonProgressStatus) => Promise<void>;
  /** Builds the "Complete online" link target for a lesson — parent and student wrappers each
   * point this at their own portal's route (the parent one needs a childId query string, the
   * student one doesn't). Omitted entirely (e.g. the admin/teacher authoring page, which doesn't
   * use this component's modal for previewing) means no "Complete online" button ever shows. */
  buildOnlineHref?: (lessonId: number) => string;
}

/** Oak-National-Academy-style unit list -> click into a lesson for its worksheet, resources, and
 * progress -- shared by the parent, student, and (as a read/progress-only base) the teacher/admin
 * authoring page. Content editing lives separately in CurriculumPlanManager; this component never
 * shows edit controls. */
export default function CurriculumTermBrowser({ term, progress, canSetProgress, onSetProgress, buildOnlineHref }: Props) {
  const [selected, setSelected] = useState<CurriculumLesson | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<number | null>(term.units[0]?.id ?? null);

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-teal-deep">
          {term.subject} — {term.class_name}
        </h2>
        <span className="text-xs font-semibold text-ink-soft">{term.term_label}</span>
      </div>
      {term.framework_label && <p className="mt-1 text-xs text-ink-soft">{term.framework_label}</p>}

      {term.units.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">No units published for this term yet.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {term.units.map((unit, unitIndex) => {
            const isOpen = expandedUnit === unit.id;
            const completedCount = unit.lessons.filter((l) => (progress.get(l.id) ?? 'not_started') === 'completed').length;
            return (
              <div key={unit.id} className="rounded-md border border-sand-line">
                <button
                  type="button"
                  onClick={() => setExpandedUnit(isOpen ? null : unit.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-sand/20"
                >
                  <span>
                    <span className="font-display text-base font-semibold text-ink">
                      Unit {unitIndex + 1}: {unit.title}
                    </span>
                    <span className="ml-2 text-xs text-ink-soft">
                      {unit.lessons.length} lesson{unit.lessons.length === 1 ? '' : 's'}
                      {unit.lessons.length > 0 && ` · ${completedCount}/${unit.lessons.length} completed`}
                    </span>
                  </span>
                  <span className="text-ink-soft">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-sand-line">
                    {unit.description && <p className="px-4 pt-3 text-sm text-ink-soft">{unit.description}</p>}
                    <ul className="flex flex-col">
                      {unit.lessons.map((lesson, lessonIndex) => (
                        <li key={lesson.id} className="border-t border-sand-line/60 first:border-t-0">
                          <button
                            type="button"
                            onClick={() => setSelected(lesson)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-sand/20"
                          >
                            <span className="text-sm font-semibold text-ink">
                              Lesson {lessonIndex + 1}: {lesson.title}
                            </span>
                            <StatusBadge status={progress.get(lesson.id) ?? 'not_started'} />
                          </button>
                        </li>
                      ))}
                      {unit.lessons.length === 0 && (
                        <li className="px-4 py-3 text-sm text-ink-soft">No lessons in this unit yet.</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <LessonDetailModal
          lesson={selected}
          status={progress.get(selected.id) ?? 'not_started'}
          canSetProgress={canSetProgress}
          onSetProgress={onSetProgress}
          onlineHref={buildOnlineHref?.(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function LessonDetailModal({
  lesson,
  status,
  canSetProgress,
  onSetProgress,
  onlineHref,
  onClose,
}: {
  lesson: CurriculumLesson;
  status: LessonProgressStatus;
  canSetProgress: boolean;
  onSetProgress?: (lessonId: number, status: LessonProgressStatus) => Promise<void>;
  onlineHref?: string;
  onClose: () => void;
}) {
  const hasOnlineContent = lesson.starter_quiz.length > 0 || lesson.exit_quiz.length > 0 || Boolean(lesson.video_url);
  const [saving, setSaving] = useState(false);
  const [localStatus, setLocalStatus] = useState(status);

  async function handleSetStatus(next: LessonProgressStatus) {
    if (!onSetProgress) return;
    setSaving(true);
    setLocalStatus(next);
    try {
      await onSetProgress(lesson.id, next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-md border border-sand-line bg-paper p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-ink">{lesson.title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-soft hover:text-ink">
            ✕
          </button>
        </div>

        {lesson.objectives && <p className="mt-3 whitespace-pre-line text-sm text-ink-soft">{lesson.objectives}</p>}

        <div className="mt-4 flex flex-wrap gap-3">
          {lesson.worksheet_url && (
            <a
              href={lesson.worksheet_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full bg-teal px-5 py-2 text-sm font-bold text-white hover:bg-teal-deep"
            >
              Download {lesson.worksheet_title || 'worksheet'} (print at home or at school)
            </a>
          )}
          {onlineHref && hasOnlineContent && (
            <Link href={onlineHref} className="inline-block rounded-full border-2 border-orange bg-orange/10 px-5 py-2 text-sm font-bold text-orange-deep hover:bg-orange/20">
              Complete online →
            </Link>
          )}
        </div>

        {lesson.resources.length > 0 && (
          <div className="mt-4 rounded-sm border border-sand-line p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Resources</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {lesson.resources.map((r) => (
                <li key={r.id}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-teal-deep underline">
                    {r.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {canSetProgress ? (
          <div className="mt-4 border-t border-sand-line/60 pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Progress</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['not_started', 'in_progress', 'completed'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={saving}
                  onClick={() => handleSetStatus(s)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
                    localStatus === s ? 'border-teal bg-teal text-white' : 'border-sand-line bg-paper text-ink hover:border-teal'
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 border-t border-sand-line/60 pt-3">
            <StatusBadge status={localStatus} />
          </div>
        )}
      </div>
    </div>
  );
}
