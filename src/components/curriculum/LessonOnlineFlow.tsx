'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CurriculumLesson, CurriculumTerm, ChildLessonOnlineProgress, QuizType } from '@/lib/curriculum';

type StepId = 'intro' | 'starter' | 'video' | 'exit';

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
export default function LessonOnlineFlow({
  lesson,
  unitTitle,
  term,
  initialProgress,
  apiBase,
  backHref,
}: {
  lesson: CurriculumLesson;
  unitTitle: string;
  term: CurriculumTerm;
  initialProgress: ChildLessonOnlineProgress;
  apiBase: string;
  backHref: string;
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [view, setView] = useState<'hub' | StepId>('hub');
  const [justCompleted, setJustCompleted] = useState(false);

  const hasStarter = lesson.starter_quiz.length > 0;
  const hasExit = lesson.exit_quiz.length > 0;
  const stepOrder: StepId[] = ['intro', ...(hasStarter ? (['starter'] as const) : []), 'video', ...(hasExit ? (['exit'] as const) : [])];

  function isStepDone(step: StepId): boolean {
    if (step === 'intro') return progress.intro_done;
    if (step === 'starter') return progress.starter_quiz_score !== null;
    if (step === 'video') return progress.video_done;
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

  async function completeQuiz(type: QuizType, score: number, total: number) {
    if (type === 'starter') {
      setProgress((p) => ({ ...p, starter_quiz_score: score, starter_quiz_total: total }));
    } else {
      setProgress((p) => ({ ...p, exit_quiz_score: score, exit_quiz_total: total, completed_at: new Date().toISOString() }));
      setJustCompleted(true);
    }
    await patchProgress({ step: type === 'starter' ? 'starter_quiz' : 'exit_quiz', score, total });
    if (type === 'exit') {
      setView('hub');
    } else {
      goToNextStep('starter');
    }
  }

  if (view === 'intro') {
    return (
      <IntroStep
        lesson={lesson}
        onBack={() => setView('hub')}
        onReady={completeIntro}
      />
    );
  }
  if (view === 'starter' && hasStarter) {
    return <QuizStep questions={lesson.starter_quiz} title="Starter Quiz" onBack={() => setView('hub')} onFinish={(score, total) => completeQuiz('starter', score, total)} />;
  }
  if (view === 'video') {
    return <VideoStep lesson={lesson} unitTitle={unitTitle} onBack={() => setView('hub')} onDone={completeVideo} />;
  }
  if (view === 'exit' && hasExit) {
    return <QuizStep questions={lesson.exit_quiz} title="Exit Quiz" onBack={() => setView('hub')} onFinish={(score, total) => completeQuiz('exit', score, total)} />;
  }

  return (
    <HubView
      lesson={lesson}
      unitTitle={unitTitle}
      term={term}
      progress={progress}
      hasStarter={hasStarter}
      hasExit={hasExit}
      backHref={backHref}
      justCompleted={justCompleted}
      allStepsDone={stepOrder.every(isStepDone)}
      onOpenStep={(s) => setView(s)}
      onContinue={() => {
        const next = stepOrder.find((s) => !isStepDone(s));
        if (next) setView(next);
      }}
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

function HubView({
  lesson,
  unitTitle,
  term,
  progress,
  hasStarter,
  hasExit,
  backHref,
  justCompleted,
  allStepsDone,
  onOpenStep,
  onContinue,
}: {
  lesson: CurriculumLesson;
  unitTitle: string;
  term: CurriculumTerm;
  progress: ChildLessonOnlineProgress;
  hasStarter: boolean;
  hasExit: boolean;
  backHref: string;
  justCompleted: boolean;
  allStepsDone: boolean;
  onOpenStep: (s: StepId) => void;
  onContinue: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-bold text-ink hover:underline">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white">←</span>
        View all lessons
      </Link>

      {justCompleted && (
        <div className="mt-4 rounded-md border border-teal/40 bg-teal/10 p-4 text-sm font-semibold text-teal-deep">
          🎉 Nice work — lesson complete!
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
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Lesson outcome</p>
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
                  ? `Completed — ${progress.starter_quiz_score}/${progress.starter_quiz_total}`
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
          {hasExit && (
            <StepCard
              color="border-yellow-500/40 bg-yellow-50"
              icon="✅"
              title="Exit quiz"
              subtitle={
                progress.exit_quiz_score !== null
                  ? `Completed — ${progress.exit_quiz_score}/${progress.exit_quiz_total}`
                  : `Check · ${lesson.exit_quiz.length} question${lesson.exit_quiz.length === 1 ? '' : 's'}`
              }
              onClick={() => onOpenStep('exit')}
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
            ✓ Lesson complete — back to all lessons
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

function IntroStep({ lesson, onBack, onReady }: { lesson: CurriculumLesson; onBack: () => void; onReady: () => void }) {
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
      <h2 className="font-display text-3xl font-bold text-ink">What will you need for this lesson?</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-md bg-teal/15 p-5">
          <p className="font-bold text-ink">Are you ready to learn?</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-soft">
            <li>Are you sitting in a quiet space away from distractions?</li>
            <li>Do you have all the equipment you need?</li>
          </ul>
          {lesson.equipment_note && <p className="mt-3 text-sm font-semibold text-ink">You&apos;ll need: {lesson.equipment_note}</p>}
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
          ) : (
            <p className="mt-3 text-sm text-ink-soft">No worksheet for this lesson — optional.</p>
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
            No video for this lesson yet — check back soon, or carry on to the next step.
          </p>
        </div>
      )}
    </StepShell>
  );
}

function QuizStep({
  questions,
  title,
  onBack,
  onFinish,
}: {
  questions: CurriculumLesson['starter_quiz'];
  title: string;
  onBack: () => void;
  onFinish: (score: number, total: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const isCorrect = selected === question.correct_option_index;

  function handleCheck() {
    if (selected === null) return;
    setChecked(true);
    if (isCorrect) setScore((s) => s + 1);
  }

  function handleNext() {
    if (isLast) {
      onFinish(score, questions.length);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setChecked(false);
    setShowHint(false);
  }

  return (
    <div className="min-h-[70vh] rounded-md bg-lime-50 p-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} aria-label="Back" className="text-xl text-ink hover:opacity-70">‹</button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg">❓</span>
            <h1 className="font-display text-lg font-bold text-ink">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-bold text-ink">{index + 1} of {questions.length}</span>
          </div>
        </div>
        <div className="mt-2 flex gap-1.5">
          {questions.map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i < index ? 'bg-ink' : i === index ? 'bg-teal' : 'bg-ink/15'}`} />
          ))}
        </div>

        <h2 className="mt-8 font-display text-2xl font-bold text-ink">{question.question}</h2>
        <p className="mt-4 inline-block rounded-full bg-lime-200 px-3 py-1 text-xs font-bold text-ink">Select one answer</p>

        <div className="mt-3 flex flex-col gap-2.5">
          {question.options.map((option, i) => {
            let style = 'border-sand-line bg-white';
            if (checked && i === question.correct_option_index) style = 'border-teal bg-teal/15';
            else if (checked && i === selected) style = 'border-orange-deep bg-orange/15';
            return (
              <button
                key={i}
                type="button"
                disabled={checked}
                onClick={() => setSelected(i)}
                className={`flex items-center gap-3 rounded-md border-2 px-4 py-3 text-left text-sm font-semibold text-ink transition ${style} ${!checked && selected === i ? 'border-ink' : ''}`}
              >
                <span className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${selected === i ? 'border-ink bg-ink' : 'border-ink-soft'}`} />
                {option}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between">
          {question.hint ? (
            <button type="button" onClick={() => setShowHint((v) => !v)} className="flex items-center gap-2 text-sm font-bold text-ink hover:underline">
              💡 {showHint ? question.hint : 'Need a hint?'}
            </button>
          ) : (
            <span />
          )}
          {!checked ? (
            <button
              type="button"
              onClick={handleCheck}
              disabled={selected === null}
              className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-ink/85 disabled:opacity-40"
            >
              Check →
            </button>
          ) : (
            <button type="button" onClick={handleNext} className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-ink/85">
              {isLast ? 'Finish →' : 'Next →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
