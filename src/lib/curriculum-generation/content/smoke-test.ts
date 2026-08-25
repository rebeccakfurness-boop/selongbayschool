import type { CurriculumTermContentModule } from './types';

/** Not real syllabus content -- a minimal, deliberately tiny fixture whose only job is proving
 * the generate-curriculum-term entrypoint actually runs end-to-end (provider lookup, pacing,
 * upsert, step-ordering validation, calculation verification) before real syllabus content is
 * authored against it. Uses a term_label no real programme should ever collide with. Safe to run
 * against a real database and safe to re-run (curriculum_terms' own UNIQUE constraint plus
 * allowUpdatingExistingTerm below make it idempotent). */
const smokeTestContent: CurriculumTermContentModule = {
  input: {
    className: 'Primary 1',
    subject: 'Mathematics',
    termLabel: 'Smoke Test (delete me)',
    frameworkLabel: 'Generation engine smoke test',
    syllabusText: 'n/a -- smoke test fixture, not a real syllabus',
    allowUpdatingExistingTerm: true,
  },
  content: {
    parsedSyllabus: {
      subject: 'Mathematics',
      frameworkLabel: 'Generation engine smoke test',
      topicTree: [{ id: 'counting-to-10', title: 'Counting to 10' }],
      assessmentObjectives: ['Count reliably to 10'],
      components: [],
    },
    units: {
      'counting-to-10': {
        topicId: 'counting-to-10',
        title: 'Counting to 10',
        description: 'Smoke-test unit -- one short lesson exercising every part of interactive_content.',
        lessons: [
          {
            title: 'Smoke test lesson',
            objectives: 'Prove the generation pipeline runs end-to-end.',
            interactiveContent: {
              steps: [
                {
                  id: 'explain-counting',
                  type: 'explanation',
                  conceptId: 'counting-to-10',
                  title: 'What is counting?',
                  definition: 'Counting means saying number names in order, one for each object.',
                  example: '1 apple, 2 apples, 3 apples...',
                },
                {
                  id: 'guess-count',
                  type: 'guess_reveal',
                  testsConceptIds: ['counting-to-10'],
                  question: 'How many fingers are on one hand?',
                  answer: '5',
                },
                { id: 'quiz-starter', type: 'quiz', quizType: 'starter' },
                {
                  id: 'recap',
                  type: 'recap_checklist',
                  summaryPoints: ['We can count objects one at a time, in order.'],
                  homeworkItems: ['Count 10 things at home and tell a grown-up.'],
                },
              ],
            },
            teachingScript: {
              overview: 'Short warm-up on 1:1 counting correspondence.',
              steps: [{ stepId: 'explain-counting', talkingPoints: ['Point at each object as you count it.'], timingMinutes: 5 }],
            },
            quizQuestions: [
              {
                quizType: 'starter',
                question: 'What number comes after 4?',
                options: ['3', '5', '6'],
                correctOptionIndex: 1,
                hint: 'Count up from 4.',
              },
            ],
            flashcards: [{ term: 'Count', definition: 'To say numbers in order, one for each object.' }],
            calculationChecks: [{ description: 'Fingers on one hand', expression: '5', expectedResult: 5 }],
          },
        ],
      },
    },
  },
};

export default smokeTestContent;
