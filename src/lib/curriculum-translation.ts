import Anthropic from '@anthropic-ai/sdk';
import { sql } from './db';
import { getLessonForOnlineFlow, type CurriculumLesson } from './curriculum';

/** Same model choice as curriculum-generation/anthropic-provider.ts, for the same reason (this
 * runs across many lessons, not a one-off) -- kept as a separate small client here rather than
 * exporting that file's internals, since translation has nothing to do with syllabus/unit
 * generation and shouldn't grow entangled with it. */
const MODEL = 'claude-sonnet-5';

export type LessonLanguage = 'fr' | 'id' | 'es';

export const LESSON_LANGUAGE_LABELS: Record<LessonLanguage, string> = {
  fr: 'French',
  id: 'Bahasa Indonesia',
  es: 'Spanish',
};

export interface TranslatedQuizQuestion {
  id: number;
  question: string;
  options: string[];
  hint: string | null;
}

export interface LessonTranslationContent {
  objectives: string | null;
  equipmentNote: string | null;
  worksheetTasks: { heading: string; instruction: string }[] | null;
  starterQuiz: TranslatedQuizQuestion[];
  exitQuiz: TranslatedQuizQuestion[];
}

function explainAnthropicError(err: unknown): Error {
  if (err instanceof Anthropic.AuthenticationError) {
    return new Error('Anthropic API key is missing or invalid (check ANTHROPIC_API_KEY in the Vercel project settings).');
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new Error('Anthropic API rate limit hit — try again shortly.');
  }
  if (err instanceof Anthropic.APIError) {
    return new Error(`Anthropic API error (${err.status}): ${err.message}`);
  }
  return err instanceof Error ? err : new Error(String(err));
}

/** Only the display text a student actually reads gets translated -- never teaching_script
 * (teacher-only) and never anything that affects scoring: quiz options come back with the same
 * array length/order as the source so TranslatedQuizQuestion.id can be matched back to the
 * original CurriculumQuizQuestion and its untranslated correct_option_index for grading. Real
 * worksheet task bodies (real_worksheet.tasks[].body, trusted HTML) are deliberately left out of
 * scope here — translating live HTML risks mangling markup, so only heading/instruction (plain
 * text) travel through translation; the task body itself is shown untranslated. */
async function translateWithClaude(lesson: CurriculumLesson, language: LessonLanguage): Promise<LessonTranslationContent> {
  const languageLabel = LESSON_LANGUAGE_LABELS[language];
  const client = new Anthropic();

  const sourceQuiz = (q: CurriculumLesson['starter_quiz'][number]) => ({ id: q.id, question: q.question, options: q.options, hint: q.hint });

  const source = {
    objectives: lesson.objectives,
    equipmentNote: lesson.equipment_note,
    worksheetTasks: lesson.real_worksheet?.tasks.map((t) => ({ heading: t.heading, instruction: t.instruction })) ?? null,
    starterQuiz: lesson.starter_quiz.map(sourceQuiz),
    exitQuiz: lesson.exit_quiz.map(sourceQuiz),
  };

  const quizQuestionSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer', description: 'Must exactly match the source question id passed in — never invent or renumber.' },
      question: { type: 'string' },
      options: { type: 'array', items: { type: 'string' } },
      hint: { type: ['string', 'null'] },
    },
    required: ['id', 'question', 'options', 'hint'],
    additionalProperties: false,
  };

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      thinking: { type: 'adaptive' },
      system:
        `You translate school lesson content from English into ${languageLabel} for a young student to read. ` +
        'Keep the meaning exact and the tone simple and friendly. Never change how many quiz options there are, ' +
        'their order, or any question/option id — only translate the text.',
      tools: [
        {
          name: 'submit_translation',
          description: `The ${languageLabel} translation of this lesson's student-facing text.`,
          input_schema: {
            type: 'object',
            properties: {
              objectives: { type: ['string', 'null'] },
              equipmentNote: { type: ['string', 'null'] },
              worksheetTasks: {
                type: ['array', 'null'],
                items: { type: 'object', properties: { heading: { type: 'string' }, instruction: { type: 'string' } }, required: ['heading', 'instruction'] },
              },
              starterQuiz: { type: 'array', items: quizQuestionSchema },
              exitQuiz: { type: 'array', items: quizQuestionSchema },
            },
            required: ['objectives', 'equipmentNote', 'worksheetTasks', 'starterQuiz', 'exitQuiz'],
            additionalProperties: false,
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'submit_translation' },
      messages: [{ role: 'user', content: JSON.stringify(source) }],
    });

    const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (!toolUse) throw new Error(`Claude did not return a translation (stop_reason: ${response.stop_reason}).`);
    return toolUse.input as LessonTranslationContent;
  } catch (err) {
    throw explainAnthropicError(err);
  }
}

/** Translates once per (lesson, language) and caches the result in curriculum_lesson_translations
 * — every later request for the same pair reads the cache instead of calling Claude again, which
 * matters both for cost and because a translation shouldn't silently drift between views. */
export async function getOrCreateLessonTranslation(lessonId: number, language: LessonLanguage): Promise<LessonTranslationContent> {
  const cached = (await sql`
    SELECT content FROM curriculum_lesson_translations WHERE lesson_id = ${lessonId} AND language = ${language}
  `) as unknown as { content: LessonTranslationContent }[];
  if (cached[0]) return cached[0].content;

  const found = await getLessonForOnlineFlow(lessonId);
  if (!found) throw new Error('Lesson not found.');

  const content = await translateWithClaude(found.lesson, language);

  await sql`
    INSERT INTO curriculum_lesson_translations (lesson_id, language, content)
    VALUES (${lessonId}, ${language}, ${JSON.stringify(content)})
    ON CONFLICT (lesson_id, language) DO UPDATE SET content = EXCLUDED.content, generated_at = now()
  `;

  return content;
}
