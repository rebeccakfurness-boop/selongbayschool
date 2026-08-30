'use client';

import { useState } from 'react';
import type { CurriculumTermTree, CurriculumLesson, LessonPhase, LessonProgressStatus } from '@/lib/curriculum';
import { flattenLessons } from '@/lib/curriculum';
import { formatDate, formatDateTime } from '@/lib/admin-format';
import CurriculumTermBrowser, { LessonDetailModal } from '@/components/CurriculumTermBrowser';

const PHASE_LABELS: Record<LessonPhase, string> = {
  content: 'Content',
  review: 'Review',
  revision: 'Revision',
  exam_skill: 'Exam skill',
  past_paper: 'Past paper',
  buffer: 'Buffer',
};
const PHASE_PILL_CLASS: Record<LessonPhase, string> = {
  content: 'bg-teal/15 text-teal-deep',
  review: 'bg-lightteal/20 text-teal-deep',
  revision: 'bg-orange/15 text-orange-deep',
  exam_skill: 'bg-orange/25 text-orange-deep',
  past_paper: 'bg-sand/50 text-ink-soft',
  buffer: 'bg-ink/10 text-ink-soft',
};
const PHASE_ORDER: LessonPhase[] = ['content', 'review', 'revision', 'exam_skill', 'past_paper', 'buffer'];

const STATUS_LABEL: Record<LessonProgressStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

interface Props {
  term: CurriculumTermTree;
  progress: Map<number, LessonProgressStatus>;
  canSetProgress: boolean;
  onSetProgress?: (lessonId: number, status: LessonProgressStatus) => Promise<void>;
  buildOnlineHref?: (lessonId: number) => string;
}

/** Read-only, per-viewer-progress-driven counterpart to the admin LessonPlanningDashboard --
 * same Home / Full sequence / Units shape, but no taught/re-teach editing (teacher-only
 * concepts) and "syllabus covered" is computed from the viewer's own progress rather than the
 * teacher's syllabus_topics.known flag. The Units tab reuses CurriculumTermBrowser wholesale
 * rather than re-implementing its accordion + lesson modal. */
export default function CurriculumDashboardView({ term, progress, canSetProgress, onSetProgress, buildOnlineHref }: Props) {
  const [tab, setTab] = useState<'home' | 'sequence' | 'units'>('home');
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const lessons = flattenLessons(term);
  const selectedLesson = lessons.find((l) => l.id === selectedLessonId) ?? null;

  function statusFor(lessonId: number): LessonProgressStatus {
    return progress.get(lessonId) ?? 'not_started';
  }

  const nextLesson = lessons.find((l) => statusFor(l.id) !== 'completed') ?? null;
  const completedCount = lessons.filter((l) => statusFor(l.id) === 'completed').length;
  const pct = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;

  if (lessons.length === 0 && term.units.length === 0) {
    return (
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-teal-deep">
          {term.subject}: {term.class_name}
        </h2>
        <p className="mt-4 text-sm text-ink-soft">No units published for this term yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            {term.subject}: {term.class_name}
          </h2>
          <p className="mt-1 text-xs text-ink-soft">{term.term_label}{term.framework_label ? ` · ${term.framework_label}` : ''}</p>
        </div>
        <div className="flex gap-2">
          {(['home', 'sequence', 'units'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                tab === t ? 'bg-teal text-white' : 'border border-sand-line bg-paper text-ink hover:border-teal'
              }`}
            >
              {t === 'home' ? 'Home' : t === 'sequence' ? 'Full sequence' : 'Units'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {tab === 'home' && (
          <HomeView
            lessons={lessons}
            nextLesson={nextLesson}
            pct={pct}
            completedCount={completedCount}
            canSetProgress={canSetProgress}
            onSetProgress={onSetProgress}
            buildOnlineHref={buildOnlineHref}
          />
        )}
        {tab === 'sequence' && (
          <SequenceView lessons={lessons} statusFor={statusFor} nextLessonId={nextLesson?.id ?? null} onOpenLesson={setSelectedLessonId} />
        )}
        {tab === 'units' && (
          <CurriculumTermBrowser term={term} progress={progress} canSetProgress={canSetProgress} onSetProgress={onSetProgress} buildOnlineHref={buildOnlineHref} />
        )}
      </div>

      {selectedLesson && (
        <LessonDetailModal
          lesson={selectedLesson}
          status={statusFor(selectedLesson.id)}
          canSetProgress={canSetProgress}
          onSetProgress={onSetProgress}
          onlineHref={buildOnlineHref?.(selectedLesson.id)}
          onClose={() => setSelectedLessonId(null)}
        />
      )}
    </div>
  );
}

function StatTile({ label, value, foot }: { label: string; value: string; foot: string }) {
  return (
    <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-soft">{foot}</p>
    </div>
  );
}

function MaterialButtons({ lesson, onlineHref }: { lesson: CurriculumLesson; onlineHref?: string }) {
  const hasOnlineContent = lesson.starter_quiz.length > 0 || lesson.exit_quiz.length > 0 || Boolean(lesson.video_url);
  const hasAny = lesson.worksheet_url || lesson.worksheet_docx_url || lesson.worksheet_pdf_url || (onlineHref && hasOnlineContent);
  return (
    <div className="flex flex-wrap gap-2">
      {lesson.worksheet_url && (
        <a href={lesson.worksheet_url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-sand-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:border-teal">
          📝 Worksheet
        </a>
      )}
      {lesson.worksheet_docx_url && (
        <a href={lesson.worksheet_docx_url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-sand-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:border-teal">
          📄 Worksheet (.docx)
        </a>
      )}
      {lesson.worksheet_pdf_url && (
        <a href={lesson.worksheet_pdf_url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-sand-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:border-teal">
          📄 Worksheet (PDF preview)
        </a>
      )}
      {onlineHref && hasOnlineContent && (
        <a href={onlineHref} className="rounded-full border-2 border-orange bg-orange/10 px-3 py-1.5 text-xs font-bold text-orange-deep hover:bg-orange/20">
          🖥️ Complete online
        </a>
      )}
      {!hasAny && <span className="text-xs text-ink-soft">Materials not available yet.</span>}
    </div>
  );
}

function HomeView({
  lessons,
  nextLesson,
  pct,
  completedCount,
  canSetProgress,
  onSetProgress,
  buildOnlineHref,
}: {
  lessons: CurriculumLesson[];
  nextLesson: CurriculumLesson | null;
  pct: number;
  completedCount: number;
  canSetProgress: boolean;
  onSetProgress?: (lessonId: number, status: LessonProgressStatus) => Promise<void>;
  buildOnlineHref?: (lessonId: number) => string;
}) {
  const nextIndex = nextLesson ? lessons.findIndex((l) => l.id === nextLesson.id) : -1;
  const [saving, setSaving] = useState(false);

  async function handleSetStatus(status: LessonProgressStatus) {
    if (!nextLesson || !onSetProgress) return;
    setSaving(true);
    try {
      await onSetProgress(nextLesson.id, status);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Current / next lesson" value={nextLesson ? `#${nextIndex + 1}` : '🎉'} foot={nextLesson ? nextLesson.title : 'All lessons complete'} />
        <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Term progress</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink">{pct}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand/40">
            <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <StatTile
          label="Next session date"
          value={nextLesson?.occurrence_date ? formatDate(nextLesson.occurrence_date) : '—'}
          foot={nextLesson ? `${PHASE_LABELS[nextLesson.phase]}${nextLesson.syllabus_ref ? ` · ${nextLesson.syllabus_ref}` : ''}` : ''}
        />
        <StatTile label="Lessons completed" value={`${completedCount} of ${lessons.length}`} foot={lessons.length ? 'Across the whole term' : ''} />
      </div>

      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Up next</h2>
        {nextLesson ? (
          <>
            <p className="mt-1 text-xs text-ink-soft">
              Lesson {nextIndex + 1} of {lessons.length}{nextLesson.syllabus_ref ? ` · ${nextLesson.syllabus_ref}` : ''}
            </p>
            <p className="mt-2 font-display text-xl font-semibold text-ink">{nextLesson.title}</p>
            <p className="text-sm text-ink-soft">
              {nextLesson.occurrence_starts_at ? formatDateTime(nextLesson.occurrence_starts_at) : 'Not scheduled yet'} · {PHASE_LABELS[nextLesson.phase]}
            </p>
            {nextLesson.objectives && <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{nextLesson.objectives}</p>}
            <div className="mt-4">
              <MaterialButtons lesson={nextLesson} onlineHref={buildOnlineHref?.(nextLesson.id)} />
            </div>
            {canSetProgress && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(['not_started', 'in_progress', 'completed'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={saving}
                    onClick={() => handleSetStatus(s)}
                    className="rounded-full border border-sand-line bg-paper px-3 py-1.5 text-xs font-bold text-ink hover:border-teal disabled:opacity-50"
                  >
                    Mark {STATUS_LABEL[s].toLowerCase()}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">You are fully up to date 🎉</p>
        )}
      </div>

      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Course snapshot</h2>
        <p className="mt-1 text-sm text-ink-soft">{completedCount} of {lessons.length} lessons completed overall.</p>
      </div>
    </div>
  );
}

function SequenceView({
  lessons,
  statusFor,
  nextLessonId,
  onOpenLesson,
}: {
  lessons: CurriculumLesson[];
  statusFor: (lessonId: number) => LessonProgressStatus;
  nextLessonId: number | null;
  onOpenLesson: (lessonId: number) => void;
}) {
  const [filter, setFilter] = useState<'all' | LessonPhase>('all');
  const filtered = filter === 'all' ? lessons : lessons.filter((l) => l.phase === filter);

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === 'all' ? 'bg-teal text-white' : 'border border-sand-line text-ink-soft hover:border-teal'}`}
        >
          All
        </button>
        {PHASE_ORDER.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setFilter(p)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === p ? 'bg-teal text-white' : 'border border-sand-line text-ink-soft hover:border-teal'}`}
          >
            {PHASE_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line text-left">
              <th className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-ink-soft">#</th>
              <th className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Date</th>
              <th className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Phase</th>
              <th className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Title</th>
              <th className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => {
              const idx = lessons.indexOf(l);
              const status = statusFor(l.id);
              return (
                <tr
                  key={l.id}
                  className={`cursor-pointer border-b border-sand-line/60 align-top hover:bg-sand/20 ${status === 'completed' ? 'opacity-60' : ''} ${l.id === nextLessonId ? 'bg-teal/5' : ''}`}
                  onClick={() => onOpenLesson(l.id)}
                >
                  <td className="px-2 py-2 font-mono text-xs text-ink-soft">{idx + 1}</td>
                  <td className="px-2 py-2 text-xs text-ink-soft">{l.occurrence_date ? formatDate(l.occurrence_date) : '—'}</td>
                  <td className="px-2 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${PHASE_PILL_CLASS[l.phase]}`}>{PHASE_LABELS[l.phase]}</span>
                  </td>
                  <td className={`px-2 py-2 ${status === 'completed' ? 'line-through' : ''}`}>{l.title}</td>
                  <td className="px-2 py-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                      <span
                        className={`h-2 w-2 rounded-full ${status === 'completed' ? 'bg-teal' : status === 'in_progress' ? 'bg-orange' : 'bg-ink-soft/30'}`}
                      />
                      {STATUS_LABEL[status]}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-4 text-center text-sm text-ink-soft">
                  No lessons match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
