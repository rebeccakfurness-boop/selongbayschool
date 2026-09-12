'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import type { CurriculumLesson, CurriculumTerm, ChildLessonOnlineProgress, QuizType } from '@/lib/curriculum';
import type { LessonLanguage, LessonTranslationContent, TranslatedQuizQuestion } from '@/lib/curriculum-translation';
import { LESSON_LANGUAGE_LABELS } from '@/lib/curriculum-translation';
import QuizStep, { type ExistingAnswer } from '@/components/curriculum/QuizStep';
import ReadAloudButton from '@/components/curriculum/ReadAloudButton';
import VoiceRecorder from '@/components/curriculum/VoiceRecorder';
import InteractiveLessonStepper from '@/components/curriculum/interactive/InteractiveLessonStepper';

type StepId = 'intro' | 'starter' | 'video' | 'discussion' | 'exit' | 'submit_worksheet';

/** Present only on the student portal (see /student/curriculum/lesson/:lessonId) -- everywhere
 * else (the parent "watch alongside" view, or a lesson mounted inside InteractiveLessonStepper)
 * this stays undefined and the flow degrades gracefully: no language switcher, no voice/typed
 * answers, no worksheet-upload step. Keeping these as one bundle rather than three separate
 * optional props makes that "all or nothing" split explicit at the type level. */
export interface OnlineLearningExtras {
  childId: number;
  answersApiBase: string;
  worksheetApiBase: string;
  translateApiBase: string;
  /** Blob upload token route -- defaults to the student one; the parent portal passes its own
   * child-scoped equivalent so a parent acting on behalf of their child uploads under the same
   * ownership check as everything else in /account. */
  uploadEndpoint?: string;
}

function youtubeEmbedUrl(url: string): string | null {
  const watch = url.match(/[?&]v=([\w-]{6,})/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  const short = url.match(/youtu\.be\/([\w-]{6,})/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  const already = url.match(/youtube\.com\/embed\//);
  if (already) return url;
  return null;
}

/** Oak-National-Academy-style self-directed lesson: Introduction -> Starter quiz -> Lesson video ->
 * Exit quiz, in Selong Bay's own palette rather than Oak's. Portal-agnostic — the parent and
 * student pages both mount this with their own apiBase (the parent one carries a childId query
 * string, the student one relies on the session's own childId server-side), so this component
 * never needs to know which portal it's in. */
/** A lesson authored (or generated) with interactive_content gets the whole new step-by-step
 * experience instead of ClassicLessonFlow's intro/starter-quiz/video/exit-quiz sequence -- every
 * lesson currently in the database has interactive_content = null, so that branch never changes
 * their behaviour. Kept as a plain dispatch with no hooks of its own (hooks can't sit after a
 * conditional return), so the two branches are separate components below. */
export default function LessonOnlineFlow(props: {
  lesson: CurriculumLesson;
  unitTitle: string;
  term: CurriculumTerm;
  initialProgress: ChildLessonOnlineProgress;
  apiBase: string;
  backHref: string;
  onlineExtras?: OnlineLearningExtras;
}) {
  if (props.lesson.interactive_content) {
    return (
      <InteractiveLessonFlow
        lesson={props.lesson}
        interactiveContent={props.lesson.interactive_content}
        initialCompleted={props.initialProgress.completed_at !== null}
        apiBase={props.apiBase}
        backHref={props.backHref}
      />
    );
  }
  return <ClassicLessonFlow {...props} />;
}

function ClassicLessonFlow({
  lesson,
  unitTitle,
  term,
  initialProgress,
  apiBase,
  backHref,
  onlineExtras,
}: {
  lesson: CurriculumLesson;
  unitTitle: string;
  term: CurriculumTerm;
  initialProgress: ChildLessonOnlineProgress;
  apiBase: string;
  backHref: string;
  onlineExtras?: OnlineLearningExtras;
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [view, setView] = useState<'hub' | StepId>('hub');
  const [justCompleted, setJustCompleted] = useState(false);

  const [language, setLanguage] = useState<'en' | LessonLanguage>('en');
  const [translationsByLang, setTranslationsByLang] = useState<Partial<Record<LessonLanguage, LessonTranslationContent>>>({});
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [existingAnswers, setExistingAnswers] = useState<ExistingAnswer[]>([]);
  const [worksheetSubmitted, setWorksheetSubmitted] = useState(false);
  const [worksheetGrade, setWorksheetGrade] = useState<{ grade: string | null; comments: string | null } | null>(null);

  const translation = language === 'en' ? null : (translationsByLang[language] ?? null);

  useEffect(() => {
    if (!onlineExtras) return;
    fetch(onlineExtras.answersApiBase)
      .then((r) => r.json())
      .then((data) => setExistingAnswers(data.answers ?? []))
      .catch(() => undefined);
    fetch(onlineExtras.worksheetApiBase)
      .then((r) => r.json())
      .then((data) => {
        if (data.submission) {
          setWorksheetSubmitted(true);
          setWorksheetGrade({ grade: data.submission.grade, comments: data.submission.comments });
        }
      })
      .catch(() => undefined);
  }, [onlineExtras]);

  async function changeLanguage(next: 'en' | LessonLanguage) {
    setLanguage(next);
    if (next === 'en' || translationsByLang[next] || !onlineExtras) return;
    setTranslationLoading(true);
    setTranslationError(null);
    try {
      const res = await fetch(`${onlineExtras.translateApiBase}?lang=${next}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not translate this lesson.');
      setTranslationsByLang((prev) => ({ ...prev, [next]: data.content }));
    } catch (err) {
      setTranslationError(err instanceof Error ? err.message : 'Could not translate this lesson.');
      setLanguage('en');
    } finally {
      setTranslationLoading(false);
    }
  }

  const translationsByQuestionId = useMemo(() => {
    if (!translation) return undefined;
    const map: Record<number, TranslatedQuizQuestion> = {};
    for (const q of [...translation.starterQuiz, ...(translation.discussionQuestions ?? []), ...translation.exitQuiz]) map[q.id] = q;
    return map;
  }, [translation]);

  const openResponseProps = onlineExtras
    ? {
        childId: onlineExtras.childId,
        uploadEndpoint: onlineExtras.uploadEndpoint,
        existingAnswers,
        onSubmit: async (quizQuestionId: number, answer: { answerText: string | null; answerAudioUrl: string | null }) => {
          const res = await fetch(onlineExtras.answersApiBase, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quizQuestionId, ...answer }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || 'Could not save your answer.');
          setExistingAnswers((prev) => [
            ...prev.filter((a) => a.quiz_question_id !== quizQuestionId),
            { quiz_question_id: quizQuestionId, answer_text: answer.answerText, answer_audio_url: answer.answerAudioUrl, grade: null, teacher_comment: null },
          ]);
        },
      }
    : undefined;

  const hasWorksheet = !!(lesson.worksheet_url || lesson.real_worksheet || lesson.worksheet_docx_url || lesson.worksheet_pdf_url);
  const hasStarter = lesson.starter_quiz.length > 0;
  const hasDiscussion = lesson.discussion_questions.length > 0;
  const hasExit = lesson.exit_quiz.length > 0;
  const canSubmitWorksheet = !!onlineExtras && hasWorksheet;
  const stepOrder: StepId[] = [
    'intro',
    ...(hasStarter ? (['starter'] as const) : []),
    'video',
    ...(hasDiscussion ? (['discussion'] as const) : []),
    ...(hasExit ? (['exit'] as const) : []),
    ...(canSubmitWorksheet ? (['submit_worksheet'] as const) : []),
  ];

  function isStepDone(step: StepId): boolean {
    if (step === 'intro') return progress.intro_done;
    if (step === 'starter') return progress.starter_quiz_score !== null;
    if (step === 'video') return progress.video_done;
    if (step === 'discussion') return progress.discussion_done;
    if (step === 'submit_worksheet') return worksheetSubmitted;
    return progress.exit_quiz_score !== null;
  }

  function goToNextStep(from: StepId) {
    const idx = stepOrder.indexOf(from);
    const next = stepOrder.slice(idx + 1).find((s) => !isStepDone(s));
    if (next) {
      setView(next);
    } else {
      setView('hub');
    }
  }

  async function patchProgress(body: Record<string, unknown>) {
    const res = await fetch(apiBase, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json().catch(() => ({}));
  }

  async function completeIntro() {
    setProgress((p) => ({ ...p, intro_done: true }));
    await patchProgress({ step: 'intro' });
    goToNextStep('intro');
  }

  async function completeVideo() {
    setProgress((p) => ({ ...p, video_done: true }));
    await patchProgress({ step: 'video' });
    goToNextStep('video');
  }

  async function completeDiscussion() {
    setProgress((p) => ({ ...p, discussion_done: true }));
    await patchProgress({ step: 'discussion' });
    goToNextStep('discussion');
  }

  async function completeQuiz(type: QuizType, score: number, total: number) {
    if (type === 'starter') {
      setProgress((p) => ({ ...p, starter_quiz_score: score, starter_quiz_total: total }));
    } else {
      setProgress((p) => ({ ...p, exit_quiz_score: score, exit_quiz_total: total, completed_at: new Date().toISOString() }));
      if (!canSubmitWorksheet) setJustCompleted(true);
    }
    await patchProgress({ step: type === 'starter' ? 'starter_quiz' : 'exit_quiz', score, total });
    if (type === 'exit') {
      goToNextStep('exit');
    } else {
      goToNextStep('starter');
    }
  }

  async function completeWorksheetSubmit() {
    setWorksheetSubmitted(true);
    setJustCompleted(true);
    setView('hub');
  }

  if (view === 'intro') {
    return (
      <IntroStep
        lesson={lesson}
        objectives={translation?.objectives ?? lesson.objectives}
        equipmentNote={translation?.equipmentNote ?? lesson.equipment_note}
        onBack={() => setView('hub')}
        onReady={completeIntro}
      />
    );
  }
  if (view === 'starter' && hasStarter) {
    return (
      <QuizStep
        questions={lesson.starter_quiz}
        title="Starter Quiz"
        onBack={() => setView('hub')}
        onFinish={(score, total) => completeQuiz('starter', score, total)}
        translations={translationsByQuestionId}
        openResponse={openResponseProps}
      />
    );
  }
  if (view === 'video') {
    return <VideoStep lesson={lesson} unitTitle={unitTitle} onBack={() => setView('hub')} onDone={completeVideo} />;
  }
  if (view === 'discussion' && hasDiscussion) {
    return (
      <QuizStep
        questions={lesson.discussion_questions}
        title="Lesson Discussion"
        onBack={() => setView('hub')}
        onFinish={completeDiscussion}
        translations={translationsByQuestionId}
        openResponse={openResponseProps}
      />
    );
  }
  if (view === 'exit' && hasExit) {
    return (
      <QuizStep
        questions={lesson.exit_quiz}
        title="Exit Quiz"
        onBack={() => setView('hub')}
        onFinish={(score, total) => completeQuiz('exit', score, total)}
        translations={translationsByQuestionId}
        openResponse={openResponseProps}
      />
    );
  }
  if (view === 'submit_worksheet' && onlineExtras) {
    return (
      <WorksheetSubmitStep
        lesson={lesson}
        childId={onlineExtras.childId}
        worksheetApiBase={onlineExtras.worksheetApiBase}
        uploadEndpoint={onlineExtras.uploadEndpoint}
        worksheetSubmitted={worksheetSubmitted}
        worksheetGrade={worksheetGrade}
        onBack={() => setView('hub')}
        onDone={completeWorksheetSubmit}
      />
    );
  }

  return (
    <HubView
      lesson={lesson}
      unitTitle={unitTitle}
      term={term}
      progress={progress}
      hasStarter={hasStarter}
      hasDiscussion={hasDiscussion}
      hasExit={hasExit}
      canSubmitWorksheet={canSubmitWorksheet}
      worksheetSubmitted={worksheetSubmitted}
      worksheetGrade={worksheetGrade}
      backHref={backHref}
      justCompleted={justCompleted}
      allStepsDone={stepOrder.every(isStepDone)}
      onOpenStep={(s) => setView(s)}
      onContinue={() => {
        const next = stepOrder.find((s) => !isStepDone(s));
        if (next) setView(next);
      }}
      showLanguageSwitcher={!!onlineExtras}
      language={language}
      onChangeLanguage={changeLanguage}
      translationLoading={translationLoading}
      translationError={translationError}
    />
  );
}

/** Thin wrapper around InteractiveLessonStepper for a lesson with interactive_content: unlike
 * ClassicLessonFlow's hub of separate cards, this is one continuous run through the step array,
 * so there's no per-milestone progress to track -- just "started" (nothing persisted) and
 * "finished" (patches apiBase with interactive_complete, which upsertOnlineProgressStep treats
 * exactly like finishing the exit quiz -- see that function's own comment). */
function InteractiveLessonFlow({
  lesson,
  interactiveContent,
  initialCompleted,
  apiBase,
  backHref,
}: {
  lesson: CurriculumLesson;
  interactiveContent: NonNullable<CurriculumLesson['interactive_content']>;
  initialCompleted: boolean;
  apiBase: string;
  backHref: string;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);

  async function handleComplete() {
    setCompleted(true);
    try {
      await fetch(apiBase, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'interactive_complete' }),
      });
    } catch {
      // Local "completed" state already shows the celebration regardless -- a failed save just
      // means the parent/admin progress view won't reflect it until the student re-opens the
      // lesson, same fail-soft behaviour as every other patchProgress call in this file.
    }
  }

  if (completed) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="rounded-md border border-teal/40 bg-teal/10 p-6 text-center">
          <p className="text-4xl">🎉</p>
          <h1 className="mt-3 font-display text-2xl font-bold text-ink">Nice work! Lesson complete!</h1>
          <p className="mt-1 text-sm text-ink-soft">{lesson.title}</p>
          <Link
            href={backHref}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-bold text-white hover:bg-teal-deep"
          >
            ✓ Back to all lessons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <InteractiveLessonStepper
      lesson={lesson}
      content={interactiveContent}
      onExit={() => router.push(backHref)}
      onComplete={handleComplete}
    />
  );
}

function StepCard({
  color,
  icon,
  title,
  subtitle,
  onClick,
}: {
  color: string;
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-md border-2 px-5 py-4 text-left transition hover:-translate-y-0.5 ${color}`}
    >
      <span className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">{icon}</span>
        <span>
          <span className="block font-display text-base font-bold text-ink">{title}</span>
          <span className="block text-sm text-ink-soft">{subtitle}</span>
        </span>
      </span>
      <span className="text-xl text-ink-soft" aria-hidden="true">›</span>
    </button>
  );
}

const LANGUAGE_OPTIONS: ('en' | LessonLanguage)[] = ['en', 'fr', 'id', 'es'];

function LanguageSwitcher({
  language,
  onChange,
  loading,
  error,
}: {
  language: 'en' | LessonLanguage;
  onChange: (l: 'en' | LessonLanguage) => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        {LANGUAGE_OPTIONS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            disabled={loading}
            className={`rounded-full px-3 py-1 text-xs font-bold transition disabled:opacity-50 ${
              language === l ? 'bg-ink text-white' : 'border border-ink/20 bg-white text-ink hover:border-ink'
            }`}
          >
            {l === 'en' ? 'English' : LESSON_LANGUAGE_LABELS[l]}
          </button>
        ))}
      </div>
      {loading && <p className="text-xs text-ink-soft">Translating…</p>}
      {error && <p className="text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}

function HubView({
  lesson,
  unitTitle,
  term,
  progress,
  hasStarter,
  hasDiscussion,
  hasExit,
  canSubmitWorksheet,
  worksheetSubmitted,
  worksheetGrade,
  backHref,
  justCompleted,
  allStepsDone,
  onOpenStep,
  onContinue,
  showLanguageSwitcher,
  language,
  onChangeLanguage,
  translationLoading,
  translationError,
}: {
  lesson: CurriculumLesson;
  unitTitle: string;
  term: CurriculumTerm;
  progress: ChildLessonOnlineProgress;
  hasStarter: boolean;
  hasDiscussion: boolean;
  hasExit: boolean;
  canSubmitWorksheet: boolean;
  worksheetSubmitted: boolean;
  worksheetGrade: { grade: string | null; comments: string | null } | null;
  backHref: string;
  justCompleted: boolean;
  allStepsDone: boolean;
  onOpenStep: (s: StepId) => void;
  onContinue: () => void;
  showLanguageSwitcher: boolean;
  language: 'en' | LessonLanguage;
  onChangeLanguage: (l: 'en' | LessonLanguage) => void;
  translationLoading: boolean;
  translationError: string | null;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-bold text-ink hover:underline">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white">←</span>
          View all lessons
        </Link>
        {showLanguageSwitcher && (
          <LanguageSwitcher language={language} onChange={onChangeLanguage} loading={translationLoading} error={translationError} />
        )}
      </div>

      {justCompleted && (
        <div className="mt-4 rounded-md border border-teal/40 bg-teal/10 p-4 text-sm font-semibold text-teal-deep">
          🎉 Nice work! Lesson complete!
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,220px)_1fr]">
        <div>
          <div className="flex h-40 w-40 items-center justify-center rounded-md bg-orange/20 text-6xl">📖</div>
          <p className="mt-3 text-sm text-ink-soft">{term.class_name} · {term.subject}</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink">{lesson.title}</h1>
          <p className="mt-1 text-xs text-ink-soft">{unitTitle}</p>
          {lesson.objectives && (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Lesson outcome</p>
                <ReadAloudButton text={lesson.objectives} label="" />
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{lesson.objectives}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <StepCard
            color="border-teal bg-teal/10"
            icon="👋"
            title="Introduction"
            subtitle={progress.intro_done ? 'Done' : 'In progress…'}
            onClick={() => onOpenStep('intro')}
          />
          {hasStarter && (
            <StepCard
              color="border-lime-600/40 bg-lime-50"
              icon="❓"
              title="Starter quiz"
              subtitle={
                progress.starter_quiz_score !== null
                  ? `Completed: ${progress.starter_quiz_score}/${progress.starter_quiz_total}`
                  : `Activate · ${lesson.starter_quiz.length} question${lesson.starter_quiz.length === 1 ? '' : 's'}`
              }
              onClick={() => onOpenStep('starter')}
            />
          )}
          <StepCard
            color="border-orange/40 bg-orange/10"
            icon="🎬"
            title="Lesson video"
            subtitle={progress.video_done ? 'Watched' : lesson.video_url ? 'Learn' : 'Coming soon'}
            onClick={() => onOpenStep('video')}
          />
          {hasDiscussion && (
            <StepCard
              color="border-purple-500/40 bg-purple-50"
              icon="💬"
              title="Lesson discussion"
              subtitle={
                progress.discussion_done
                  ? 'Done'
                  : `Talk it through · ${lesson.discussion_questions.length} question${lesson.discussion_questions.length === 1 ? '' : 's'}`
              }
              onClick={() => onOpenStep('discussion')}
            />
          )}
          {hasExit && (
            <StepCard
              color="border-yellow-500/40 bg-yellow-50"
              icon="✅"
              title="Exit quiz"
              subtitle={
                progress.exit_quiz_score !== null
                  ? `Completed: ${progress.exit_quiz_score}/${progress.exit_quiz_total}`
                  : `Check · ${lesson.exit_quiz.length} question${lesson.exit_quiz.length === 1 ? '' : 's'}`
              }
              onClick={() => onOpenStep('exit')}
            />
          )}
          {canSubmitWorksheet && (
            <StepCard
              color="border-teal-deep/40 bg-teal/5"
              icon="📤"
              title="Submit your worksheet"
              subtitle={
                worksheetGrade?.grade
                  ? `Marked: ${worksheetGrade.grade}`
                  : worksheetSubmitted
                    ? 'Sent to your teacher'
                    : 'Upload your completed worksheet'
              }
              onClick={() => onOpenStep('submit_worksheet')}
            />
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-end border-t border-sand-line pt-5">
        {allStepsDone ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-bold text-white hover:bg-teal-deep"
          >
            ✓ Lesson complete: back to all lessons
          </Link>
        ) : (
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-ink/85"
          >
            Continue lesson →
          </button>
        )}
      </div>
    </div>
  );
}

function StepShell({
  color,
  icon,
  title,
  onBack,
  children,
  footer,
}: {
  color: string;
  icon: string;
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className={`min-h-[70vh] rounded-md ${color} p-6`}>
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} aria-label="Back" className="text-xl text-ink hover:opacity-70">‹</button>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg">{icon}</span>
          <h1 className="font-display text-lg font-bold text-ink">{title}</h1>
        </div>
        <div className="mt-8">{children}</div>
        <div className="mt-10 flex justify-end">{footer}</div>
      </div>
    </div>
  );
}

function IntroStep({
  lesson,
  objectives,
  equipmentNote,
  onBack,
  onReady,
}: {
  lesson: CurriculumLesson;
  objectives: string | null;
  equipmentNote: string | null;
  onBack: () => void;
  onReady: () => void;
}) {
  return (
    <StepShell
      color="bg-teal/10"
      icon="👋"
      title="Introduction"
      onBack={onBack}
      footer={
        <button type="button" onClick={onReady} className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-ink/85">
          I&apos;m ready →
        </button>
      }
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-3xl font-bold text-ink">What will you need for this lesson?</h2>
        {objectives && <ReadAloudButton text={objectives} label="" />}
      </div>
      {objectives && <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{objectives}</p>}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-md bg-teal/15 p-5">
          <p className="font-bold text-ink">Are you ready to learn?</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-soft">
            <li>Are you sitting in a quiet space away from distractions?</li>
            <li>Do you have all the equipment you need?</li>
          </ul>
          {equipmentNote && <p className="mt-3 text-sm font-semibold text-ink">You&apos;ll need: {equipmentNote}</p>}
        </div>
        <div className="rounded-md bg-white p-5 shadow-soft">
          <p className="font-bold text-ink">Worksheet</p>
          {lesson.worksheet_url ? (
            <a
              href={lesson.worksheet_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-bold text-teal-deep underline"
            >
              Download {lesson.worksheet_title || 'worksheet'}
            </a>
          ) : lesson.worksheet_docx_url || lesson.worksheet_pdf_url ? (
            <a
              href={lesson.worksheet_docx_url || lesson.worksheet_pdf_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-bold text-teal-deep underline"
            >
              Download worksheet
            </a>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">No worksheet for this lesson (optional).</p>
          )}
        </div>
      </div>
    </StepShell>
  );
}

function VideoStep({
  lesson,
  unitTitle,
  onBack,
  onDone,
}: {
  lesson: CurriculumLesson;
  unitTitle: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const embedUrl = lesson.video_url ? youtubeEmbedUrl(lesson.video_url) : null;
  const isVideoFile = lesson.video_url ? /\.(mp4|webm|mov)$/i.test(lesson.video_url) : false;

  return (
    <StepShell
      color="bg-orange/10"
      icon="🎬"
      title="Lesson video"
      onBack={onBack}
      footer={
        <button type="button" onClick={onDone} className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-ink/85">
          {lesson.video_url ? "I've finished the video →" : 'Continue →'}
        </button>
      }
    >
      {lesson.video_url ? (
        embedUrl ? (
          <div className="aspect-video w-full overflow-hidden rounded-md border-2 border-ink bg-black">
            <iframe src={embedUrl} title={lesson.video_title || lesson.title} className="h-full w-full" allowFullScreen />
          </div>
        ) : isVideoFile ? (
          <video src={lesson.video_url} controls className="aspect-video w-full rounded-md border-2 border-ink bg-black" />
        ) : (
          <div className="rounded-md border-2 border-ink bg-white p-6 text-center">
            <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="font-bold text-teal-deep underline">
              Open the lesson video
            </a>
          </div>
        )
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center rounded-md border-2 border-dashed border-ink/30 bg-white/60 text-center">
          <p className="text-4xl">🎬</p>
          <p className="mt-3 font-display text-xl font-bold text-ink">{lesson.title}</p>
          <p className="mt-1 text-sm text-ink-soft">{unitTitle}</p>
          <p className="mt-4 max-w-sm text-sm text-ink-soft">
            No video for this lesson yet: check back soon, or carry on to the next step.
          </p>
        </div>
      )}
    </StepShell>
  );
}

function WorksheetSubmitStep({
  lesson,
  childId,
  worksheetApiBase,
  uploadEndpoint,
  worksheetSubmitted,
  worksheetGrade,
  onBack,
  onDone,
}: {
  lesson: CurriculumLesson;
  childId: number;
  worksheetApiBase: string;
  uploadEndpoint?: string;
  worksheetSubmitted: boolean;
  worksheetGrade: { grade: string | null; comments: string | null } | null;
  onBack: () => void;
  onDone: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await upload(`children/${childId}/lesson-worksheets/${lesson.id}/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: uploadEndpoint || '/api/student/upload',
      });
      setFileUrl(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload your worksheet.');
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!fileUrl && !audioUrl) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(worksheetApiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl, answerAudioUrl: audioUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not submit your worksheet.');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your worksheet.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StepShell
      color="bg-teal/5"
      icon="📤"
      title="Submit your worksheet"
      onBack={onBack}
      footer={
        <button
          type="button"
          onClick={submit}
          disabled={(!fileUrl && !audioUrl) || submitting}
          className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-ink/85 disabled:opacity-40"
        >
          {submitting ? 'Sending…' : 'Send to my teacher →'}
        </button>
      }
    >
      <h2 className="font-display text-2xl font-bold text-ink">Show your teacher your completed worksheet</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Upload a photo or scan, or just record yourself talking through your answers -- your teacher will mark it and
        send back a grade and comments either way.
      </p>
      {worksheetGrade?.grade && (
        <div className="mt-4 rounded-md border border-teal/40 bg-teal/10 p-4">
          <p className="font-bold text-teal-deep">Marked: {worksheetGrade.grade}</p>
          {worksheetGrade.comments && <p className="mt-1 text-sm text-ink-soft">{worksheetGrade.comments}</p>}
        </div>
      )}
      {worksheetSubmitted && !worksheetGrade?.grade && (
        <p className="mt-4 rounded-md border border-sand-line bg-white p-4 text-sm text-ink-soft">
          Already sent to your teacher — you can send a new version below if you&apos;d like to replace it.
        </p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border-2 border-dashed border-ink/30 bg-white p-6 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-soft">Upload a photo or scan</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFile}
            disabled={uploading}
            className="mx-auto text-sm"
          />
          {uploading && <p className="mt-2 text-sm text-ink-soft">Uploading…</p>}
          {fileUrl && !uploading && <p className="mt-2 text-sm font-semibold text-teal-deep">✓ Ready to send</p>}
        </div>
        <div className="rounded-md border-2 border-dashed border-ink/30 bg-white p-6 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-soft">Or record your answers</p>
          <div className="flex justify-center">
            <VoiceRecorder
              pathPrefix={`children/${childId}/lesson-worksheets/${lesson.id}`}
              uploadEndpoint={uploadEndpoint}
              onRecorded={setAudioUrl}
            />
          </div>
          {audioUrl && <p className="mt-2 text-sm font-semibold text-teal-deep">✓ Ready to send</p>}
        </div>
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-orange-deep">{error}</p>}
    </StepShell>
  );
}
