'use client';

import { useState } from 'react';
import type { CurriculumLesson } from '@/lib/curriculum';
import type { TranslatedQuizQuestion } from '@/lib/curriculum-translation';
import ReadAloudButton from '@/components/curriculum/ReadAloudButton';
import VoiceRecorder from '@/components/curriculum/VoiceRecorder';

export interface ExistingAnswer {
  quiz_question_id: number;
  answer_text: string | null;
  answer_audio_url: string | null;
  grade: string | null;
  teacher_comment: string | null;
}

/** Only present on the student portal (see LessonOnlineFlow) — everywhere else an open_response
 * question falls back to a read-only "answered by the student directly" notice rather than
 * crashing, since this quiz renderer is shared with InteractiveLessonStepper's quiz-reference step
 * and the parent-portal "watch alongside" view, neither of which submit answers on a child's
 * behalf. */
export interface OpenResponseSubmission {
  childId: number;
  /** Blob upload token route for a recorded voice answer -- defaults to the student one; see
   * OnlineLearningExtras.uploadEndpoint. */
  uploadEndpoint?: string;
  existingAnswers: ExistingAnswer[];
  onSubmit: (quizQuestionId: number, answer: { answerText: string | null; answerAudioUrl: string | null }) => Promise<void>;
}

/** The multiple-choice-*and*-open-response quiz renderer for curriculum_lesson_quiz_questions,
 * shared by the "Complete online" flow's starter/exit quiz steps (LessonOnlineFlow.tsx) and
 * InteractiveLessonStepper's 'quiz' step type -- extracted here so a second quiz component was
 * never built for the interactive stepper, per the shared-content requirement. score/total in
 * onFinish only ever counts multiple_choice questions; an open_response question just needs to be
 * answered (typed or recorded) to move on, since there's nothing to auto-score. */
export default function QuizStep({
  questions,
  title,
  onBack,
  onFinish,
  translations,
  openResponse,
}: {
  questions: CurriculumLesson['starter_quiz'];
  title: string;
  onBack: () => void;
  onFinish: (score: number, total: number) => void;
  translations?: Record<number, TranslatedQuizQuestion>;
  openResponse?: OpenResponseSubmission;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [scored, setScored] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const isCorrect = selected === question.correct_option_index;
  const t = translations?.[question.id];
  const displayQuestion = t?.question ?? question.question;
  const displayOptions = t?.options ?? question.options;
  const displayHint = t?.hint ?? question.hint;

  function handleCheck() {
    if (selected === null) return;
    setChecked(true);
    setScored((s) => s + 1);
    if (isCorrect) setScore((s) => s + 1);
  }

  function advance() {
    if (isLast) {
      onFinish(score, scored);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setChecked(false);
    setShowHint(false);
  }

  if (question.question_type === 'open_response') {
    return (
      <OpenResponseQuestion
        key={question.id}
        question={question}
        displayQuestion={displayQuestion}
        displayHint={displayHint}
        index={index}
        total={questions.length}
        isLast={isLast}
        title={title}
        onBack={onBack}
        onAdvance={advance}
        openResponse={openResponse}
      />
    );
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

        <div className="mt-8 flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-ink">{displayQuestion}</h2>
          <ReadAloudButton text={[displayQuestion, ...displayOptions].join('. ')} />
        </div>
        <p className="mt-4 inline-block rounded-full bg-lime-200 px-3 py-1 text-xs font-bold text-ink">Select one answer</p>

        <div className="mt-3 flex flex-col gap-2.5">
          {displayOptions.map((option, i) => {
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
          {displayHint ? (
            <button type="button" onClick={() => setShowHint((v) => !v)} className="flex items-center gap-2 text-sm font-bold text-ink hover:underline">
              💡 {showHint ? displayHint : 'Need a hint?'}
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
            <button type="button" onClick={advance} className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-ink/85">
              {isLast ? 'Finish →' : 'Next →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OpenResponseQuestion({
  question,
  displayQuestion,
  displayHint,
  index,
  total,
  isLast,
  title,
  onBack,
  onAdvance,
  openResponse,
}: {
  question: CurriculumLesson['starter_quiz'][number];
  displayQuestion: string;
  displayHint: string | null;
  index: number;
  total: number;
  isLast: boolean;
  title: string;
  onBack: () => void;
  onAdvance: () => void;
  openResponse?: OpenResponseSubmission;
}) {
  const existing = openResponse?.existingAnswers.find((a) => a.quiz_question_id === question.id) ?? null;
  const [text, setText] = useState(existing?.answer_text ?? '');
  const [audioUrl, setAudioUrl] = useState<string | null>(existing?.answer_audio_url ?? null);
  const [submitted, setSubmitted] = useState(!!existing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitAndAdvance() {
    if (!openResponse) {
      onAdvance();
      return;
    }
    if (!text.trim() && !audioUrl) return;
    setSaving(true);
    setError(null);
    try {
      await openResponse.onSubmit(question.id, { answerText: text.trim() || null, answerAudioUrl: audioUrl });
      setSubmitted(true);
      onAdvance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your answer.');
    } finally {
      setSaving(false);
    }
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
          <span className="font-display text-lg font-bold text-ink">{index + 1} of {total}</span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i < index ? 'bg-ink' : i === index ? 'bg-teal' : 'bg-ink/15'}`} />
          ))}
        </div>

        <div className="mt-8 flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-ink">{displayQuestion}</h2>
          <ReadAloudButton text={displayQuestion} />
        </div>
        <p className="mt-4 inline-block rounded-full bg-lime-200 px-3 py-1 text-xs font-bold text-ink">
          Answer in your own words — type it, or record yourself saying it
        </p>
        {displayHint && <p className="mt-2 text-sm italic text-ink-soft">💡 {displayHint}</p>}

        {openResponse ? (
          <div className="mt-4 flex flex-col gap-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Type your answer here…"
              className="w-full rounded-md border-2 border-sand-line bg-white p-4 text-sm text-ink placeholder:text-ink-soft/50"
            />
            <VoiceRecorder
              pathPrefix={`children/${openResponse.childId}/lesson-answers/${question.id}`}
              uploadEndpoint={openResponse.uploadEndpoint}
              onRecorded={setAudioUrl}
            />
            {existing?.grade && (
              <div className="rounded-md border border-teal/40 bg-teal/10 p-3 text-sm">
                <p className="font-bold text-teal-deep">Marked: {existing.grade}</p>
                {existing.teacher_comment && <p className="mt-1 text-ink-soft">{existing.teacher_comment}</p>}
              </div>
            )}
            {error && <p className="text-sm font-semibold text-orange-deep">{error}</p>}
          </div>
        ) : (
          <p className="mt-4 rounded-md border border-sand-line bg-white p-4 text-sm text-ink-soft">
            This question is answered by the student directly when they log in themselves.
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={submitAndAdvance}
            disabled={saving || (!!openResponse && !submitted && !text.trim() && !audioUrl)}
            className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-ink/85 disabled:opacity-40"
          >
            {saving ? 'Saving…' : isLast ? 'Finish →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
