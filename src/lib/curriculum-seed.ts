/** A draft first term of Primary 1 Mathematics, organised around the strands of the Cambridge
 * Primary Mathematics curriculum framework for Stage 1 (Number; Geometry and Measure;
 * Statistics and Probability, with the "Thinking and Working Mathematically" characteristics
 * woven into individual lesson objectives rather than treated as their own strand).
 *
 * This is original lesson-plan content written for this seed, informed by the publicly known
 * structure/objectives of that framework — not a reproduction of Cambridge's own copyrighted
 * materials. It exists so the Curriculum Plans feature has a real worked example rather than an
 * empty screen, and is explicitly a DRAFT: every unit/lesson needs a teacher's review (and each
 * lesson still needs its actual worksheet attached) before being relied on for real teaching.
 * Imported only when an admin clicks "Import sample term" — never seeded automatically — and
 * safe to click once; a second click is blocked by curriculum_terms' own uniqueness constraint.
 */

export interface SampleLessonSeed {
  title: string;
  objectives: string;
}

export interface SampleUnitSeed {
  title: string;
  description: string;
  lessons: SampleLessonSeed[];
}

export const SAMPLE_TERM = {
  className: 'Primary 1',
  subject: 'Mathematics',
  termLabel: 'Term 1 (draft)',
  frameworkLabel: 'Cambridge Primary Mathematics, Stage 1 (draft)',
};

export const SAMPLE_UNITS: SampleUnitSeed[] = [
  {
    title: 'Numbers to 10',
    description: 'Building secure counting and number recognition to 10 before any calculation work begins.',
    lessons: [
      { title: 'Counting objects to 10', objectives: 'Count a group of up to 10 objects reliably, touching or moving each one once. Understand that the last number said gives the total (cardinality).' },
      { title: 'Reading and writing numbers to 10', objectives: 'Recognise and read numerals 0–10. Write numerals 0–10, matching each to the correct quantity.' },
      { title: 'Ordering numbers to 10', objectives: 'Place numbers 0–10 in order. Identify the number before, after, and between given numbers.' },
      { title: 'One more, one less', objectives: 'Find one more and one less than a given number up to 10, using objects and a number line.' },
    ],
  },
  {
    title: 'Comparing and Ordering Numbers',
    description: 'Moving from counting to comparing quantities and making simple estimates.',
    lessons: [
      { title: 'Comparing groups', objectives: 'Compare two groups of objects and say which has more, fewer, or if they are the same, without necessarily counting both fully.' },
      { title: 'Ordering sets by size', objectives: 'Order three or more groups of objects from smallest to largest by quantity.' },
      { title: 'Estimating small quantities', objectives: 'Make a sensible estimate of a small quantity (up to 10) and check by counting.' },
    ],
  },
  {
    title: 'Addition within 10',
    description: 'Introducing addition as combining two groups, moving from concrete objects to number sentences.',
    lessons: [
      { title: 'Combining two groups', objectives: 'Combine two groups of objects and count the total, understanding addition as "putting together".' },
      { title: 'Addition number sentences', objectives: 'Use the + and = signs to record addition number sentences for totals to 10.' },
      { title: 'Addition stories', objectives: 'Solve simple addition word problems within 10, choosing objects, a number line, or number sentences to help.' },
    ],
  },
  {
    title: 'Subtraction within 10',
    description: 'Introducing subtraction as taking away, alongside addition, so the two are seen as related.',
    lessons: [
      { title: 'Taking away', objectives: 'Understand subtraction as "taking away" from a group of up to 10 objects and finding how many are left.' },
      { title: 'Subtraction number sentences', objectives: 'Use the − and = signs to record subtraction number sentences within 10.' },
      { title: 'Subtraction stories', objectives: 'Solve simple subtraction word problems within 10, explaining the method used.' },
    ],
  },
  {
    title: '2D and 3D Shapes',
    description: 'Naming, sorting, and describing common shapes found in the classroom and everyday life.',
    lessons: [
      { title: 'Naming and sorting 2D shapes', objectives: 'Name common 2D shapes (circle, triangle, square, rectangle) and sort a mixed group by shape.' },
      { title: 'Naming and sorting 3D shapes', objectives: 'Name common 3D shapes (cube, sphere, cone, cylinder) and find examples of each around the classroom.' },
      { title: 'Shape patterns', objectives: 'Continue and create a simple repeating pattern using 2D shapes.' },
    ],
  },
  {
    title: 'Measures: Length, Mass, and Capacity',
    description: 'Comparing everyday objects directly, before any use of standard units.',
    lessons: [
      { title: 'Comparing lengths', objectives: 'Compare two or more objects by length, using the language longer, shorter, and the same length as.' },
      { title: 'Comparing mass', objectives: 'Compare two objects by weight using a balance, using the language heavier, lighter, and the same weight as.' },
      { title: 'Comparing capacity', objectives: 'Compare the capacity of two containers, using the language holds more, holds less, and holds the same as.' },
    ],
  },
  {
    title: 'Position, Direction, and Time',
    description: 'Everyday language for where things are, and a first introduction to reading the time.',
    lessons: [
      { title: 'Positional language', objectives: 'Describe the position of an object using everyday language: over, under, next to, in front of, behind, between.' },
      { title: 'Days of the week', objectives: 'Name the days of the week in order and identify today, yesterday, and tomorrow.' },
      { title: "Introducing o'clock times", objectives: "Read o'clock times on an analogue clock and relate them to daily routine events." },
    ],
  },
];
