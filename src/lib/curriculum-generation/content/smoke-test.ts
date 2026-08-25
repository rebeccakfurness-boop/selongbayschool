import type { CurriculumTermContentModule } from './types';

/** Not real syllabus content -- a minimal fixture whose only job is proving the
 * generate-curriculum-term entrypoint and every interactive_content widget type actually work,
 * before real syllabus content is authored against them. Deliberately exercises every step type
 * ported from rebeccakfurness-boop/selongbayschool-teaching's lesson-kit (see
 * interactive-content-types.ts's own file comment), including the two invariants that must hold:
 * explanation-before-test ordering (guess-count/sort/inline-quiz all testsConceptIds against
 * counting-to-10, authored after its explanation step) and no answer shown before it's asked
 * (enforced at render time by GuessRevealCard/InlineQuizCards, not just by this ordering).
 * Uses a term_label no real programme should ever collide with. Safe to run against a real
 * database and safe to re-run (curriculum_terms' own UNIQUE constraint plus
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
        description: 'Smoke-test unit exercising every interactive_content widget type.',
        lessons: [
          {
            title: 'Smoke test lesson',
            objectives: 'Prove the generation pipeline and every widget type render end-to-end.',
            interactiveContent: {
              steps: [
                {
                  id: 'explain-counting',
                  type: 'explanation',
                  kicker: 'New idea',
                  title: 'What is counting?',
                  conceptId: 'counting-to-10',
                  definition: 'Counting means saying number names in order, one for each object.',
                  example: '1 apple, 2 apples, 3 apples...',
                },
                {
                  id: 'flip-recap',
                  type: 'flip_card',
                  kicker: 'Quick recap',
                  title: 'Number Words',
                  lede: 'Tap each card to flip it and check the answer.',
                  cards: [
                    { term: 'One', definition: 'The number 1.' },
                    { term: 'Two', definition: 'The number 2.' },
                    { term: 'Three', definition: 'The number 3.' },
                    { term: 'Four', definition: 'The number 4.' },
                  ],
                },
                {
                  id: 'guess-count',
                  type: 'guess_reveal',
                  kicker: 'Now you try',
                  title: 'Guess First',
                  testsConceptIds: ['counting-to-10'],
                  cards: [
                    { question: 'How many fingers are on one hand?', answer: '5', tags: [{ label: 'COUNTING', tone: 'up' }] },
                    { question: 'How many wheels does a bicycle have?', answer: '2', tags: [{ label: 'COUNTING', tone: 'up' }] },
                  ],
                },
                {
                  id: 'sort-odd-even',
                  type: 'sort_classify',
                  kicker: 'Classify',
                  title: 'Odd or Even?',
                  lede: 'Classify each number, then check your answer.',
                  categories: ['Odd', 'Even'],
                  testsConceptIds: ['counting-to-10'],
                  items: [
                    { id: 'n2', label: '2', correctCategory: 'Even', reason: '2 splits into two equal groups of 1.' },
                    { id: 'n3', label: '3', correctCategory: 'Odd', reason: '3 cannot split into two equal whole groups.' },
                  ],
                },
                {
                  id: 'shift-grid',
                  type: 'tap_reveal_grid',
                  kicker: 'Explore',
                  title: 'Ways to Group 10',
                  cards: [
                    { id: 'pairs', icon: '👫', label: 'Pairs', content: '5 pairs of 2 make 10.' },
                    { id: 'fives', icon: '🖐️', label: 'Fives', content: '2 groups of 5 make 10.' },
                  ],
                },
                {
                  id: 'worked-example',
                  type: 'worked_example',
                  kicker: 'Worked example',
                  title: 'Counting Up From 6',
                  steps: [
                    { label: 'Start', detail: '6' },
                    { label: 'Count on 1', detail: '6, 7' },
                    { label: 'Count on 2', detail: '6, 7, 8' },
                    { label: 'Answer', detail: '8' },
                  ],
                },
                {
                  id: 'calculator',
                  type: 'interactive_calculator',
                  kicker: 'Try it',
                  title: 'How Many Left?',
                  scenarios: [
                    { id: 'a', label: '10 - 3', readouts: [{ label: 'Answer', value: '7' }] },
                    { id: 'b', label: '10 - 6', readouts: [{ label: 'Answer', value: '4' }] },
                  ],
                },
                {
                  id: 'data-table',
                  type: 'data_table',
                  kicker: 'Compare',
                  title: 'Counting Objects',
                  columns: ['Object', 'Count'],
                  rows: [
                    ['Apples', 4],
                    ['Bananas', 6],
                  ],
                  highlightRowIndex: 1,
                },
                {
                  id: 'bar-compare',
                  type: 'proportional_bar_compare',
                  kicker: 'Compare',
                  title: 'Fruit Bowl',
                  unit: 'items',
                  items: [
                    { label: 'Apples', value: 4, tone: 'teal' },
                    { label: 'Bananas', value: 6, tone: 'orange' },
                  ],
                },
                { id: 'quiz-starter', type: 'quiz', kicker: 'Quick check', title: 'Starter Quiz', quizType: 'starter' },
                {
                  id: 'inline-quiz',
                  type: 'inline_quiz',
                  kicker: 'Before we finish',
                  title: 'One More Check',
                  testsConceptIds: ['counting-to-10'],
                  questions: [
                    {
                      question: 'What number comes after 7?',
                      options: ['6', '8', '9'],
                      correctOptionIndex: 1,
                      feedback: 'Counting on from 7 gives 8.',
                    },
                  ],
                },
                {
                  id: 'recap',
                  type: 'recap_checklist',
                  kicker: 'Recap + homework',
                  title: "Today's Key Words",
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
