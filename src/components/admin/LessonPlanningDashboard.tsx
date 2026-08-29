'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, TextInput } from '@/components/forms/FormField';
import Button from '@/components/Button';
import InteractiveLessonStepper from '@/components/curriculum/interactive/InteractiveLessonStepper';
import { formatDate, formatDateTime } from '@/lib/admin-format';
import type {
  CurriculumTermTree,
  CurriculumLesson,
  LessonPhase,
  SyllabusTopicRow,
  AssignableOccurrenceRow,
} from '@/lib/curriculum';
import { flattenLessons } from '@/lib/curriculum';

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

async function patchLesson(id: number, body: Record<string, unknown>) {
  await fetch(`/api/admin/curriculum/lessons/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function hasMaterials(lesson: CurriculumLesson): boolean {
  return lesson.interactive_content !== null;
}

/** Loose prefix match against a lesson's (possibly multi-ref) syllabus_ref, e.g. "2.4.3 / 2.5"
 * covers both "2.4" and "2.5" -- mirrors how syllabus refs are actually written up rather than
 * requiring an exact, single-ref match. */
function lessonsForTopicRef(lessons: CurriculumLesson[], ref: string): CurriculumLesson[] {
  return lessons.filter((l) => l.syllabus_ref?.split(/[\s/]+/).some((part) => part === ref || part.startsWith(ref)));
}

export default function LessonPlanningDashboard({
  term,
  syllabusTopics,
  assignableOccurrences,
}: {
  term: CurriculumTermTree;
  syllabusTopics: SyllabusTopicRow[];
  assignableOccurrences: AssignableOccurrenceRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'home' | 'sequence' | 'syllabus'>('home');
  const [lessons, setLessons] = useState<CurriculumLesson[]>(() => flattenLessons(term));
  const [topics, setTopics] = useState<SyllabusTopicRow[]>(syllabusTopics);
  const [previewLessonId, setPreviewLessonId] = useState<number | null>(null);
  const [scriptLessonId, setScriptLessonId] = useState<number | null>(null);
  const [cardsLessonId, setCardsLessonId] = useState<number | null>(null);

  function updateLessonLocal(id: number, patch: Partial<CurriculumLesson>) {
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  async function toggleTaught(lesson: CurriculumLesson) {
    const next = !lesson.taught;
    updateLessonLocal(lesson.id, { taught: next, taught_at: next ? new Date().toISOString() : null });
    await patchLesson(lesson.id, { taught: next });
    router.refresh();
  }

  async function toggleReteach(lesson: CurriculumLesson) {
    const next = !lesson.flagged_for_reteach;
    updateLessonLocal(lesson.id, { flagged_for_reteach: next });
    await patchLesson(lesson.id, { flaggedForReteach: next });
    router.refresh();
  }

  async function assignOccurrence(lesson: CurriculumLesson, occurrenceId: number | null) {
    const occ = assignableOccurrences.find((o) => o.occurrence_id === occurrenceId);
    updateLessonLocal(lesson.id, {
      occurrence_id: occurrenceId,
      occurrence_date: occ?.occurrence_date ?? null,
      occurrence_starts_at: occ?.starts_at ?? null,
    });
    await patchLesson(lesson.id, { occurrenceId });
    router.refresh();
  }

  async function toggleKnown(topic: SyllabusTopicRow) {
    const next = !topic.known;
    setTopics((prev) => prev.map((t) => (t.id === topic.id ? { ...t, known: next } : t)));
    await fetch(`/api/admin/curriculum/syllabus-topics/${topic.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ known: next }),
    });
    router.refresh();
  }

  const nextLesson = lessons.find((l) => !l.taught) ?? null;
  const contentLessons = lessons.filter((l) => l.phase === 'content' || l.phase === 'review');
  const donePct = contentLessons.length ? Math.round((contentLessons.filter((l) => l.taught).length / contentLessons.length) * 100) : 0;
  const reteachList = lessons.filter((l) => l.flagged_for_reteach);
  const previewLesson = lessons.find((l) => l.id === previewLessonId) ?? null;
  const scriptLesson = lessons.find((l) => l.id === scriptLessonId) ?? null;
  const cardsLesson = lessons.find((l) => l.id === cardsLessonId) ?? null;

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {term.class_name} · {term.subject}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">{term.term_label}{term.framework_label ? ` · ${term.framework_label}` : ''}</p>
        </div>
        <div className="flex gap-2">
          {(['home', 'sequence', 'syllabus'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                tab === t ? 'bg-teal text-white' : 'border border-sand-line bg-paper text-ink hover:border-teal'
              }`}
            >
              {t === 'home' ? 'Home' : t === 'sequence' ? 'Full sequence' : 'Syllabus map'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {tab === 'home' && (
          <HomeView
            lessons={lessons}
            nextLesson={nextLesson}
            donePct={donePct}
            reteachList={reteachList}
            onToggleTaught={toggleTaught}
            onOpenPreview={setPreviewLessonId}
            onOpenScript={setScriptLessonId}
            onOpenCards={setCardsLessonId}
          />
        )}
        {tab === 'sequence' && (
          <SequenceView
            lessons={lessons}
            nextLessonId={nextLesson?.id ?? null}
            assignableOccurrences={assignableOccurrences}
            onToggleTaught={toggleTaught}
            onToggleReteach={toggleReteach}
            onAssignOccurrence={assignOccurrence}
            onOpenPreview={setPreviewLessonId}
            onOpenScript={setScriptLessonId}
            onOpenCards={setCardsLessonId}
          />
        )}
        {tab === 'syllabus' && (
          <SyllabusMapView lessons={lessons} topics={topics} termId={term.id} onToggleKnown={toggleKnown} onTopicAdded={(t) => setTopics((prev) => [...prev, t])} />
        )}
      </div>

      {previewLesson?.interactive_content && (
        <div className="mt-6 overflow-hidden rounded-md border-2 border-orange-deep/30">
          <div className="flex items-center justify-between bg-orange/15 px-4 py-2">
            <p className="text-xs font-bold uppercase tracking-wide text-orange-deep">
              Preview -- {previewLesson.title} -- read-only, nothing here is saved
            </p>
            <button type="button" onClick={() => setPreviewLessonId(null)} className="text-xs font-bold text-orange-deep hover:underline">
              Close
            </button>
          </div>
          <InteractiveLessonStepper
            lesson={previewLesson}
            content={previewLesson.interactive_content}
            onExit={() => setPreviewLessonId(null)}
            onComplete={() => setPreviewLessonId(null)}
          />
        </div>
      )}

      {scriptLesson?.teaching_script && (
        <TeachingScriptPanel lesson={scriptLesson} onClose={() => setScriptLessonId(null)} />
      )}
      {cardsLesson && cardsLesson.flashcards.length > 0 && (
        <FlashcardsPanel lesson={cardsLesson} onClose={() => setCardsLessonId(null)} />
      )}
    </section>
  );
}

function MaterialButtons({
  lesson,
  onOpenPreview,
  onOpenScript,
  onOpenCards,
}: {
  lesson: CurriculumLesson;
  onOpenPreview: (id: number) => void;
  onOpenScript: (id: number) => void;
  onOpenCards: (id: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {lesson.teaching_script && (
        <button type="button" onClick={() => onOpenScript(lesson.id)} className="rounded-full border border-sand-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:border-teal">
          📘 Teaching script
        </button>
      )}
      {lesson.worksheet_url && (
        <a
          href={lesson.worksheet_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-sand-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:border-teal"
        >
          📝 Worksheet
        </a>
      )}
      {lesson.interactive_content && (
        <button type="button" onClick={() => onOpenPreview(lesson.id)} className="rounded-full border border-sand-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:border-teal">
          🖥️ Interactive lesson
        </button>
      )}
      {lesson.flashcards.length > 0 && (
        <button type="button" onClick={() => onOpenCards(lesson.id)} className="rounded-full border border-sand-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:border-teal">
          🃏 Flashcards ({lesson.flashcards.length})
        </button>
      )}
      {!hasMaterials(lesson) && !lesson.worksheet_url && !lesson.teaching_script && (
        <span className="text-xs text-ink-soft">Materials not generated yet.</span>
      )}
    </div>
  );
}

function HomeView({
  lessons,
  nextLesson,
  donePct,
  reteachList,
  onToggleTaught,
  onOpenPreview,
  onOpenScript,
  onOpenCards,
}: {
  lessons: CurriculumLesson[];
  nextLesson: CurriculumLesson | null;
  donePct: number;
  reteachList: CurriculumLesson[];
  onToggleTaught: (lesson: CurriculumLesson) => void;
  onOpenPreview: (id: number) => void;
  onOpenScript: (id: number) => void;
  onOpenCards: (id: number) => void;
}) {
  const doneTotal = lessons.filter((l) => l.taught).length;
  const nextIndex = nextLesson ? lessons.findIndex((l) => l.id === nextLesson.id) : -1;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Current / next lesson" value={nextLesson ? `#${nextIndex + 1}` : '🎉'} foot={nextLesson ? nextLesson.title : 'All lessons taught'} />
        <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Syllabus covered</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink">{donePct}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand/40">
            <div className="h-full rounded-full bg-teal" style={{ width: `${donePct}%` }} />
          </div>
        </div>
        <StatTile
          label="Next session date"
          value={nextLesson?.occurrence_date ? formatDate(nextLesson.occurrence_date) : '—'}
          foot={nextLesson ? `${PHASE_LABELS[nextLesson.phase]}${nextLesson.syllabus_ref ? ` · ${nextLesson.syllabus_ref}` : ''}` : ''}
        />
        <StatTile label="Flagged for re-teach" value={String(reteachList.length)} foot={reteachList.length ? reteachList.map((l) => `#${lessons.indexOf(l) + 1}`).join(', ') : 'None right now'} />
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
            <div className="mt-4">
              <MaterialButtons lesson={nextLesson} onOpenPreview={onOpenPreview} onOpenScript={onOpenScript} onOpenCards={onOpenCards} />
            </div>
            <div className="mt-4">
              <Button type="button" variant="primary" onClick={() => onToggleTaught(nextLesson)}>
                ✓ Mark taught &amp; advance
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">You are fully up to date 🎉</p>
        )}
      </div>

      {reteachList.length > 0 && (
        <div className="rounded-md border border-orange-deep/30 bg-orange/5 p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold text-orange-deep">Needs a re-teach</h2>
          <p className="text-xs text-ink-soft">Flagged from the Full sequence view</p>
          <ul className="mt-3 flex flex-col gap-2">
            {reteachList.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  <span className="mr-2 font-mono text-xs text-ink-soft">#{lessons.indexOf(l) + 1}</span>
                  {l.title}
                </span>
                {l.teaching_script && (
                  <button type="button" onClick={() => onOpenScript(l.id)} className="text-xs font-semibold text-teal-deep underline">
                    Open script →
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Course snapshot</h2>
        <p className="mt-1 text-sm text-ink-soft">{doneTotal} of {lessons.length} lessons marked taught overall.</p>
      </div>
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

function SequenceView({
  lessons,
  nextLessonId,
  assignableOccurrences,
  onToggleTaught,
  onToggleReteach,
  onAssignOccurrence,
  onOpenPreview,
  onOpenScript,
  onOpenCards,
}: {
  lessons: CurriculumLesson[];
  nextLessonId: number | null;
  assignableOccurrences: AssignableOccurrenceRow[];
  onToggleTaught: (lesson: CurriculumLesson) => void;
  onToggleReteach: (lesson: CurriculumLesson) => void;
  onAssignOccurrence: (lesson: CurriculumLesson, occurrenceId: number | null) => void;
  onOpenPreview: (id: number) => void;
  onOpenScript: (id: number) => void;
  onOpenCards: (id: number) => void;
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
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line text-left">
              <th className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-ink-soft">#</th>
              <th className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Date</th>
              <th className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Phase</th>
              <th className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Ref</th>
              <th className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Title</th>
              <th className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Materials</th>
              <th className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => {
              const idx = lessons.indexOf(l);
              return (
                <tr
                  key={l.id}
                  className={`border-b border-sand-line/60 align-top ${l.taught ? 'opacity-60' : ''} ${l.id === nextLessonId ? 'bg-teal/5' : ''}`}
                >
                  <td className="px-2 py-2 font-mono text-xs text-ink-soft">{idx + 1}</td>
                  <td className="px-2 py-2 text-xs text-ink-soft">
                    <OccurrencePicker lesson={l} assignableOccurrences={assignableOccurrences} onAssign={onAssignOccurrence} />
                  </td>
                  <td className="px-2 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${PHASE_PILL_CLASS[l.phase]}`}>{PHASE_LABELS[l.phase]}</span>
                  </td>
                  <td className="px-2 py-2 font-mono text-xs text-ink-soft">{l.syllabus_ref || '—'}</td>
                  <td className={`px-2 py-2 ${l.taught ? 'line-through' : ''}`}>{l.title}</td>
                  <td className="px-2 py-2">
                    <MaterialButtons lesson={l} onOpenPreview={onOpenPreview} onOpenScript={onOpenScript} onOpenCards={onOpenCards} />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        title="Mark taught"
                        onClick={() => onToggleTaught(l)}
                        className={`rounded-sm border px-2 py-1 text-xs font-bold ${l.taught ? 'border-transparent bg-teal text-white' : 'border-sand-line text-ink-soft hover:border-teal'}`}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        title="Flag for re-teach"
                        onClick={() => onToggleReteach(l)}
                        className={`rounded-sm border px-2 py-1 text-xs font-bold ${l.flagged_for_reteach ? 'border-transparent bg-orange-deep text-white' : 'border-sand-line text-ink-soft hover:border-orange-deep'}`}
                      >
                        ⚠
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-6 text-center text-sm text-ink-soft">No lessons in this phase yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OccurrencePicker({
  lesson,
  assignableOccurrences,
  onAssign,
}: {
  lesson: CurriculumLesson;
  assignableOccurrences: AssignableOccurrenceRow[];
  onAssign: (lesson: CurriculumLesson, occurrenceId: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="whitespace-nowrap hover:text-teal-deep hover:underline">
        {lesson.occurrence_date ? formatDate(lesson.occurrence_date) : 'Not scheduled'}
      </button>
    );
  }
  return (
    <select
      autoFocus
      defaultValue={lesson.occurrence_id ?? ''}
      onChange={(e) => {
        onAssign(lesson, e.target.value ? Number(e.target.value) : null);
        setEditing(false);
      }}
      onBlur={() => setEditing(false)}
      className="rounded-sm border border-sand-line bg-white px-2 py-1 text-xs text-ink"
    >
      <option value="">Not scheduled</option>
      {assignableOccurrences.map((o) => (
        <option key={o.occurrence_id} value={o.occurrence_id}>
          {formatDate(o.occurrence_date)}
          {o.already_assigned_lesson_title && o.occurrence_id !== lesson.occurrence_id ? ` (${o.already_assigned_lesson_title})` : ''}
        </option>
      ))}
    </select>
  );
}

function TeachingScriptPanel({ lesson, onClose }: { lesson: CurriculumLesson; onClose: () => void }) {
  const script = lesson.teaching_script!;
  return (
    <div className="mt-6 rounded-md border-2 border-teal/30 bg-paper p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-teal-deep">Teaching script -- {lesson.title}</h3>
        <button type="button" onClick={onClose} className="text-xs font-bold text-ink-soft hover:underline">Close</button>
      </div>
      <p className="mt-2 text-sm text-ink-soft">{script.overview}</p>
      <ol className="mt-4 flex flex-col gap-3">
        {script.steps.map((step, i) => (
          <li key={step.stepId} className="rounded-sm border border-sand-line bg-white p-3">
            <p className="text-xs font-bold text-ink-soft">
              Step {i + 1} · {step.stepId}
              {step.timingMinutes ? ` · ~${step.timingMinutes} min` : ''}
            </p>
            <ul className="mt-1.5 list-disc pl-5 text-sm text-ink">
              {step.talkingPoints.map((p, j) => <li key={j}>{p}</li>)}
            </ul>
            {step.misconceptions && step.misconceptions.length > 0 && (
              <div className="mt-2 rounded-sm bg-orange/10 p-2 text-xs text-orange-deep">
                <span className="font-bold">Watch for: </span>
                {step.misconceptions.join(' · ')}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function FlashcardsPanel({ lesson, onClose }: { lesson: CurriculumLesson; onClose: () => void }) {
  return (
    <div className="mt-6 rounded-md border-2 border-teal/30 bg-paper p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-teal-deep">Flashcards -- {lesson.title}</h3>
        <button type="button" onClick={onClose} className="text-xs font-bold text-ink-soft hover:underline">Close</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {lesson.flashcards.map((c) => (
          <div key={c.id} className="rounded-sm border border-sand-line bg-white p-3">
            <p className="font-display text-sm font-semibold text-ink">{c.term}</p>
            <p className="mt-1 text-xs text-ink-soft">{c.definition}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SyllabusMapView({
  lessons,
  topics,
  termId,
  onToggleKnown,
  onTopicAdded,
}: {
  lessons: CurriculumLesson[];
  topics: SyllabusTopicRow[];
  termId: number;
  onToggleKnown: (topic: SyllabusTopicRow) => void;
  onTopicAdded: (topic: SyllabusTopicRow) => void;
}) {
  const topLevel = useMemo(() => topics.filter((t) => !t.parent_ref).sort((a, b) => a.sort_order - b.sort_order || a.ref.localeCompare(b.ref)), [topics]);
  const childrenOf = (ref: string) => topics.filter((t) => t.parent_ref === ref).sort((a, b) => a.sort_order - b.sort_order || a.ref.localeCompare(b.ref));

  const [adding, setAdding] = useState(false);
  const [ref, setRef] = useState('');
  const [parentRef, setParentRef] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  async function addTopic() {
    if (!ref.trim() || !title.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/admin/curriculum/terms/${termId}/syllabus-topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref, parentRef: parentRef || null, title }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      onTopicAdded({ id: data.id, term_id: termId, ref, parent_ref: parentRef || null, title, known: false, sort_order: 0 });
      setRef('');
      setParentRef('');
      setTitle('');
      setAdding(false);
    }
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">Which syllabus points are already known, already taught, or still pending.</p>
        <button type="button" onClick={() => setAdding((v) => !v)} className="text-xs font-semibold text-teal-deep hover:underline">
          {adding ? 'Cancel' : '+ Add topic'}
        </button>
      </div>

      {adding && (
        <div className="mt-3 grid gap-3 rounded-sm border border-sand-line bg-white p-4 sm:grid-cols-4">
          <Field label="Ref" htmlFor="topic-ref"><TextInput id="topic-ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. 2.4" /></Field>
          <Field label="Parent ref (optional)" htmlFor="topic-parent"><TextInput id="topic-parent" value={parentRef} onChange={(e) => setParentRef(e.target.value)} placeholder="e.g. 2" /></Field>
          <div className="sm:col-span-2">
            <Field label="Title" htmlFor="topic-title"><TextInput id="topic-title" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          </div>
          <div className="sm:col-span-4">
            <Button type="button" variant="primary" onClick={addTopic} disabled={saving}>{saving ? 'Saving…' : 'Add'}</Button>
          </div>
        </div>
      )}

      {topLevel.length === 0 && !adding && <p className="mt-4 text-sm text-ink-soft">No syllabus topics recorded yet.</p>}

      <div className="mt-4 flex flex-col gap-5">
        {topLevel.map((topic) => (
          <div key={topic.id}>
            <h3 className="font-display text-sm font-semibold text-ink">{topic.ref}. {topic.title}</h3>
            <ul className="mt-1.5 flex flex-col divide-y divide-sand-line/60">
              {childrenOf(topic.ref).map((sub) => {
                const covering = lessonsForTopicRef(lessons, sub.ref);
                const taughtAny = covering.some((l) => l.taught);
                return (
                  <li key={sub.id} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                    <span>
                      <span className="mr-2 font-mono text-xs text-ink-soft">{sub.ref}</span>
                      {sub.title}
                    </span>
                    <span className="flex items-center gap-2">
                      {sub.known ? (
                        <span className="rounded-full bg-teal/15 px-2 py-0.5 text-xs font-bold text-teal-deep">✓ Already known</span>
                      ) : taughtAny ? (
                        <span className="rounded-full bg-teal/15 px-2 py-0.5 text-xs font-bold text-teal-deep">✓ Taught</span>
                      ) : covering.length > 0 ? (
                        <span className="text-xs text-ink-soft">Lesson {covering.map((l) => lessons.indexOf(l) + 1).join(', ')}</span>
                      ) : (
                        <span className="text-xs text-ink-soft">Not yet planned</span>
                      )}
                      <button type="button" onClick={() => onToggleKnown(sub)} className="text-xs font-semibold text-ink-soft underline hover:text-teal-deep">
                        {sub.known ? 'Unmark known' : 'Mark known'}
                      </button>
                    </span>
                  </li>
                );
              })}
              {childrenOf(topic.ref).length === 0 && <li className="py-1.5 text-xs text-ink-soft">No subtopics recorded.</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
