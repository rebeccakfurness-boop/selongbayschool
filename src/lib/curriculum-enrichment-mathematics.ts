import type { EnrichmentLessonSeed } from './curriculum-enrichment-types';

/** Draft "Complete online" quiz content (equipment note + starter/exit quiz) for every lesson in
 * the Primary 1 and Primary 2 Mathematics programmes -- see curriculum-enrichment-seed.ts for how
 * this is matched to already-imported lessons and imported, and CurriculumPlanManager.tsx for how
 * a teacher can edit or replace any of it afterwards. Explicitly a draft, same as the lesson
 * content itself: every question needs a teacher's review before real use.
 */
export const MATHEMATICS_ENRICHMENT: EnrichmentLessonSeed[] = [
  // ===== Primary 1 Mathematics =====
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Numbers to 10', lessonTitle: 'Counting objects to 10',
    equipmentNote: 'a small pile of 10 or so household objects (buttons, blocks, pasta) to count',
    starterQuiz: [
      { question: 'When you count a group of objects, what number do you say last?', options: ['The smallest number', 'The total number of objects', 'Zero'], correctOptionIndex: 1, hint: 'The last number you say tells you how many there are altogether.' },
      { question: 'How many fingers are on one hand?', options: ['4', '5', '6'], correctOptionIndex: 1 },
      { question: 'When counting objects, what should you do to each one?', options: ['Touch or move it once', 'Skip every other one', 'Count it twice'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'You count 7 toys, touching each one once. How many toys are there?', options: ['6', '7', '8'], correctOptionIndex: 1 },
      { question: 'If you count a group and lose track, what should you do?', options: ['Guess', 'Start counting again carefully', 'Say a random number'], correctOptionIndex: 1 },
      { question: 'Count: 🍎🍎🍎🍎. How many apples?', options: ['3', '4', '5'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Numbers to 10', lessonTitle: 'Reading and writing numbers to 10',
    equipmentNote: 'pencil and paper (or the printed worksheet)',
    starterQuiz: [
      { question: 'Which numeral is "seven"?', options: ['5', '7', '9'], correctOptionIndex: 1 },
      { question: 'How many numerals are there from 0 to 10?', options: ['9', '10', '11'], correctOptionIndex: 2, hint: 'Count 0, 1, 2, 3... all the way to 10.' },
      { question: 'Which number matches this group: ●●●●●?', options: ['4', '5', '6'], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: 'Write the numeral for "three". Which is correct?', options: ['2', '3', '8'], correctOptionIndex: 1 },
      { question: 'Which numeral is "ten"?', options: ['1', '10', '100'], correctOptionIndex: 1 },
      { question: 'Match the quantity ●●●●●●● to its numeral.', options: ['6', '7', '8'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Numbers to 10', lessonTitle: 'Ordering numbers to 10',
    equipmentNote: 'number cards 0-10, or write them on paper',
    starterQuiz: [
      { question: 'What number comes right after 5?', options: ['4', '6', '7'], correctOptionIndex: 1 },
      { question: 'What number comes right before 8?', options: ['7', '9', '6'], correctOptionIndex: 0 },
      { question: 'Which number is between 3 and 5?', options: ['2', '4', '6'], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: 'Put these in order, smallest first: 6, 2, 9. Which comes first?', options: ['2', '6', '9'], correctOptionIndex: 0 },
      { question: 'What number comes after 9?', options: ['8', '10', '11'], correctOptionIndex: 1 },
      { question: 'Which number is between 7 and 9?', options: ['6', '8', '10'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Numbers to 10', lessonTitle: 'One more, one less',
    equipmentNote: 'a number line 0-10 (drawn on paper is fine)',
    starterQuiz: [
      { question: 'What is one more than 4?', options: ['3', '5', '6'], correctOptionIndex: 1 },
      { question: 'What is one less than 7?', options: ['6', '8', '5'], correctOptionIndex: 0 },
      { question: 'On a number line, is "one more" to the left or right?', options: ['Left', 'Right', 'Neither'], correctOptionIndex: 1, hint: 'Numbers get bigger as you move right on a number line.' },
    ],
    exitQuiz: [
      { question: 'What is one more than 9?', options: ['8', '10', '11'], correctOptionIndex: 1 },
      { question: 'What is one less than 1?', options: ['0', '2', '-1'], correctOptionIndex: 0 },
      { question: 'What is one more than 6?', options: ['5', '6', '7'], correctOptionIndex: 2 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Comparing and Ordering Numbers', lessonTitle: 'Comparing groups',
    equipmentNote: 'two small piles of objects to compare, e.g. buttons or blocks',
    starterQuiz: [
      { question: 'Group A has 5 toys, Group B has 3 toys. Which group has more?', options: ['Group A', 'Group B', 'They are the same'], correctOptionIndex: 0 },
      { question: 'What word means two groups have the same amount?', options: ['More', 'Fewer', 'Equal'], correctOptionIndex: 2 },
      { question: 'Group A has 2 toys, Group B has 6 toys. Which group has fewer?', options: ['Group A', 'Group B', 'They are the same'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: '4 apples and 4 oranges — are the groups equal?', options: ['Yes', 'No', 'Cannot tell'], correctOptionIndex: 0 },
      { question: 'Which has more: 8 pencils or 5 pencils?', options: ['8 pencils', '5 pencils', 'Same'], correctOptionIndex: 0 },
      { question: 'Which word describes a group with a smaller amount?', options: ['More', 'Fewer', 'Equal'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Comparing and Ordering Numbers', lessonTitle: 'Ordering sets by size',
    equipmentNote: 'three small groups of objects of different sizes',
    starterQuiz: [
      { question: 'You have groups of 2, 7, and 4 objects. Which is smallest?', options: ['2', '7', '4'], correctOptionIndex: 0 },
      { question: 'What does "ordering from smallest to largest" mean?', options: ['Biggest group first', 'Smallest group first', 'Any order'], correctOptionIndex: 1 },
      { question: 'Groups of 3, 1, 5 in order smallest first: which is last?', options: ['1', '3', '5'], correctOptionIndex: 2 },
    ],
    exitQuiz: [
      { question: 'Order 6, 2, 9 from smallest to largest — what comes first?', options: ['2', '6', '9'], correctOptionIndex: 0 },
      { question: 'Order 4, 8, 1 from smallest to largest — what comes last?', options: ['1', '4', '8'], correctOptionIndex: 2 },
      { question: 'Which group is the largest: 3, 7, or 5?', options: ['3', '7', '5'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Comparing and Ordering Numbers', lessonTitle: 'Estimating small quantities',
    equipmentNote: 'a handful of small objects to estimate and then count',
    starterQuiz: [
      { question: 'What does "estimate" mean?', options: ['Count exactly', 'Make a sensible guess', 'Ignore the amount'], correctOptionIndex: 1, hint: 'An estimate is a careful guess, not an exact count.' },
      { question: 'After estimating, what should you do?', options: ['Nothing', 'Check by counting', 'Estimate again'], correctOptionIndex: 1 },
      { question: 'Which is a sensible estimate for a small handful of beans: 5 or 500?', options: ['5', '500', 'Neither'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'You estimate 6 counters, then count 7. Was your estimate close?', options: ['Yes, very close', 'No, way off', 'Cannot tell'], correctOptionIndex: 0 },
      { question: 'A sensible estimate should be...', options: ['A wild random number', 'Roughly the right amount', 'Always exactly right'], correctOptionIndex: 1 },
      { question: 'Why do we check an estimate by counting?', options: ['To see how close it was', 'It is not needed', 'Counting is faster'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Addition within 10', lessonTitle: 'Combining two groups',
    equipmentNote: 'small objects to combine into groups, e.g. blocks or buttons',
    starterQuiz: [
      { question: 'If you put a group of 3 and a group of 2 together, what do you get?', options: ['A smaller group', 'A combined group of 5', 'Two separate groups'], correctOptionIndex: 1 },
      { question: 'What does "putting together" mean in maths?', options: ['Subtracting', 'Addition', 'Comparing'], correctOptionIndex: 1 },
      { question: '2 toys plus 4 toys combined makes how many?', options: ['5', '6', '7'], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: 'Combine a group of 4 and a group of 3. How many altogether?', options: ['6', '7', '8'], correctOptionIndex: 1 },
      { question: 'Combine a group of 5 and a group of 5. How many altogether?', options: ['9', '10', '11'], correctOptionIndex: 1 },
      { question: 'Which operation means "putting groups together"?', options: ['Addition', 'Subtraction', 'Ordering'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Addition within 10', lessonTitle: 'Addition number sentences',
    equipmentNote: 'pencil and paper to write number sentences',
    starterQuiz: [
      { question: 'Which sign means "add"?', options: ['−', '+', '='], correctOptionIndex: 1 },
      { question: 'What does the = sign mean?', options: ['Is equal to', 'Is more than', 'Add'], correctOptionIndex: 0 },
      { question: 'Which is a correct addition sentence?', options: ['3 + 2 = 5', '3 − 2 = 5', '3 = 2 + 5'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'What is 4 + 3?', options: ['6', '7', '8'], correctOptionIndex: 1 },
      { question: 'What is 5 + 5?', options: ['9', '10', '11'], correctOptionIndex: 1 },
      { question: 'Fill in the blank: 2 + __ = 6', options: ['2', '4', '8'], correctOptionIndex: 1, hint: 'Think: 2 plus what makes 6?' },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Addition within 10', lessonTitle: 'Addition stories',
    equipmentNote: 'objects or a number line to help solve word problems',
    starterQuiz: [
      { question: '"Ali has 3 apples, Mum gives him 2 more" — what maths should you do?', options: ['Add', 'Subtract', 'Compare'], correctOptionIndex: 0 },
      { question: 'What is a good first step for a word problem?', options: ['Guess the answer', 'Work out what is happening', 'Skip it'], correctOptionIndex: 1 },
      { question: 'Which tool can help solve an addition story?', options: ['A number line', 'A clock', 'A ruler'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Sam has 4 stickers, then finds 3 more. How many now?', options: ['6', '7', '8'], correctOptionIndex: 1 },
      { question: 'There are 5 birds, and 4 more land. How many birds now?', options: ['8', '9', '10'], correctOptionIndex: 1 },
      { question: '"2 dogs and 3 more dogs arrive" — what number sentence matches?', options: ['2 + 3 = 5', '2 − 3 = 5', '3 + 3 = 5'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Subtraction within 10', lessonTitle: 'Taking away',
    equipmentNote: 'small objects to take away from a group',
    starterQuiz: [
      { question: 'If you have 5 sweets and eat 2, what happened to the group?', options: ['It grew', 'It shrank', 'It stayed the same'], correctOptionIndex: 1 },
      { question: 'What does "taking away" mean?', options: ['Adding more', 'Removing some', 'Counting again'], correctOptionIndex: 1 },
      { question: 'You have 6 blocks and take away 4. How many left?', options: ['1', '2', '3'], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: 'You have 8 grapes and eat 3. How many are left?', options: ['4', '5', '6'], correctOptionIndex: 1 },
      { question: 'You have 10 marbles and give away 6. How many left?', options: ['3', '4', '5'], correctOptionIndex: 1 },
      { question: 'Taking away from a group makes the group...', options: ['Bigger', 'Smaller', 'The same'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Subtraction within 10', lessonTitle: 'Subtraction number sentences',
    equipmentNote: 'pencil and paper to write number sentences',
    starterQuiz: [
      { question: 'Which sign means "subtract"?', options: ['+', '−', '='], correctOptionIndex: 1 },
      { question: 'Which is a correct subtraction sentence?', options: ['5 − 2 = 3', '5 + 2 = 3', '5 = 2 − 3'], correctOptionIndex: 0 },
      { question: 'What is 7 − 3?', options: ['3', '4', '5'], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: 'What is 9 − 4?', options: ['4', '5', '6'], correctOptionIndex: 1 },
      { question: 'What is 10 − 6?', options: ['3', '4', '5'], correctOptionIndex: 1 },
      { question: 'Fill in the blank: 8 − __ = 5', options: ['2', '3', '4'], correctOptionIndex: 1, hint: 'Think: 8 minus what makes 5?' },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Subtraction within 10', lessonTitle: 'Subtraction stories',
    equipmentNote: 'objects or a number line to help solve word problems',
    starterQuiz: [
      { question: '"There were 6 birds, 2 flew away" — what maths should you do?', options: ['Add', 'Subtract', 'Compare'], correctOptionIndex: 1 },
      { question: 'What is a good way to explain your method?', options: ['Say what you did step by step', 'Just give the answer', 'Guess'], correctOptionIndex: 0 },
      { question: 'Which sign matches "how many are left"?', options: ['+', '−', '='], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: 'There were 9 apples, 3 were eaten. How many are left?', options: ['5', '6', '7'], correctOptionIndex: 1 },
      { question: 'There were 7 balloons, 4 popped. How many are left?', options: ['2', '3', '4'], correctOptionIndex: 1 },
      { question: '"8 fish, 5 swim away" — what number sentence matches?', options: ['8 − 5 = 3', '8 + 5 = 3', '5 − 8 = 3'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: '2D and 3D Shapes', lessonTitle: 'Naming and sorting 2D shapes',
    equipmentNote: 'a mixed group of shape cut-outs or household objects shaped like circles/squares/triangles',
    starterQuiz: [
      { question: 'How many sides does a triangle have?', options: ['2', '3', '4'], correctOptionIndex: 1 },
      { question: 'How many sides does a square have?', options: ['3', '4', '5'], correctOptionIndex: 1 },
      { question: 'Which shape has no straight sides at all?', options: ['Circle', 'Square', 'Triangle'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'A rectangle has how many sides?', options: ['3', '4', '5'], correctOptionIndex: 1 },
      { question: 'Which shape is round?', options: ['Triangle', 'Circle', 'Square'], correctOptionIndex: 1 },
      { question: 'A shape with 3 sides is called a...', options: ['Square', 'Circle', 'Triangle'], correctOptionIndex: 2 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: '2D and 3D Shapes', lessonTitle: 'Naming and sorting 3D shapes',
    equipmentNote: 'household objects shaped like a cube, ball, and cone (a box, a ball, a party hat)',
    starterQuiz: [
      { question: 'Which shape is a ball-shape called?', options: ['Cube', 'Sphere', 'Cylinder'], correctOptionIndex: 1 },
      { question: 'Which shape looks like a box?', options: ['Cube', 'Cone', 'Sphere'], correctOptionIndex: 0 },
      { question: 'Which shape has a pointed top and a round bottom?', options: ['Cylinder', 'Cone', 'Cube'], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: 'A can of food is shaped like a...', options: ['Cylinder', 'Cube', 'Sphere'], correctOptionIndex: 0 },
      { question: 'Which 3D shape is round like a football?', options: ['Cube', 'Sphere', 'Cone'], correctOptionIndex: 1 },
      { question: 'A dice is shaped like a...', options: ['Cube', 'Cone', 'Sphere'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: '2D and 3D Shapes', lessonTitle: 'Shape patterns',
    equipmentNote: 'shape cut-outs or drawings to make a repeating pattern',
    starterQuiz: [
      { question: 'What is a repeating pattern?', options: ['Random shapes', 'The same order repeated', 'Only one shape'], correctOptionIndex: 1 },
      { question: 'In circle, square, circle, square, ___ — what comes next?', options: ['Circle', 'Square', 'Triangle'], correctOptionIndex: 0 },
      { question: 'What do you need to continue a pattern?', options: ['Find the repeating part', 'Guess randomly', 'Use only new shapes'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Triangle, triangle, circle, triangle, triangle, circle, ___ — what comes next?', options: ['Triangle', 'Circle', 'Square'], correctOptionIndex: 0 },
      { question: 'Square, circle, square, circle, ___ — what comes next?', options: ['Square', 'Circle', 'Triangle'], correctOptionIndex: 1 },
      { question: 'A pattern that repeats has a...', options: ['Unit that repeats', 'No order', 'Only 1 shape ever'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Measures: Length, Mass, and Capacity', lessonTitle: 'Comparing lengths',
    equipmentNote: 'two objects of different lengths, e.g. two pencils or two pieces of string',
    starterQuiz: [
      { question: 'What word describes an object with more length?', options: ['Shorter', 'Longer', 'Same'], correctOptionIndex: 1 },
      { question: 'A pencil is 10cm and a crayon is 6cm. Which is longer?', options: ['Pencil', 'Crayon', 'Same'], correctOptionIndex: 0 },
      { question: 'What word means two objects are the same length?', options: ['Longer', 'Shorter', 'Same length as'], correctOptionIndex: 2 },
    ],
    exitQuiz: [
      { question: 'A rope is shorter than a hose. Which has less length?', options: ['Rope', 'Hose', 'Same'], correctOptionIndex: 0 },
      { question: 'Which is likely longer: a table or a spoon?', options: ['Table', 'Spoon', 'Same'], correctOptionIndex: 0 },
      { question: 'How can you compare two objects’ length directly?', options: ['Guess', 'Place them side by side', 'Weigh them'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Measures: Length, Mass, and Capacity', lessonTitle: 'Comparing mass',
    equipmentNote: 'two objects of different weights to compare by holding, or a simple balance if you have one',
    starterQuiz: [
      { question: 'What word describes an object with more weight?', options: ['Lighter', 'Heavier', 'Same'], correctOptionIndex: 1 },
      { question: 'A feather and a rock — which is heavier?', options: ['Feather', 'Rock', 'Same'], correctOptionIndex: 1 },
      { question: 'What tool helps compare weight directly?', options: ['A ruler', 'A balance', 'A clock'], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: 'A book and a pencil — which is likely heavier?', options: ['Book', 'Pencil', 'Same'], correctOptionIndex: 0 },
      { question: 'What word means two objects weigh the same?', options: ['Heavier', 'Lighter', 'Same weight as'], correctOptionIndex: 2 },
      { question: 'On a balance, the heavier object goes...', options: ['Up', 'Down', 'Sideways'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Measures: Length, Mass, and Capacity', lessonTitle: 'Comparing capacity',
    equipmentNote: 'two different-sized containers and some water or sand (optional)',
    starterQuiz: [
      { question: 'What does "capacity" mean?', options: ['How heavy something is', 'How much a container can hold', 'How long something is'], correctOptionIndex: 1 },
      { question: 'A big cup and a small cup — which holds more?', options: ['Big cup', 'Small cup', 'Same'], correctOptionIndex: 0 },
      { question: 'What phrase means a container holds less than another?', options: ['Holds more', 'Holds less', 'Holds the same as'], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: 'A bucket and a teaspoon — which holds more?', options: ['Bucket', 'Teaspoon', 'Same'], correctOptionIndex: 0 },
      { question: 'What phrase means two containers hold the same amount?', options: ['Holds more', 'Holds less', 'Holds the same as'], correctOptionIndex: 2 },
      { question: 'Which is a good way to compare two containers’ capacity?', options: ['Guess', 'Fill one and pour into the other', 'Weigh them empty'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Position, Direction, and Time', lessonTitle: 'Positional language',
    equipmentNote: 'a couple of toys or objects to place in different positions',
    starterQuiz: [
      { question: 'If a cup is on the table, where is it?', options: ['Under the table', 'On the table', 'Behind the table'], correctOptionIndex: 1 },
      { question: 'Which word describes something between two other things?', options: ['Over', 'Between', 'Under'], correctOptionIndex: 1 },
      { question: 'If a ball rolls under the bed, where is it?', options: ['Over the bed', 'Under the bed', 'Next to the bed'], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: 'A dog stands in front of a house. Where is the dog?', options: ['In front of the house', 'Behind the house', 'Inside the house'], correctOptionIndex: 0 },
      { question: 'Which word means "close beside"?', options: ['Next to', 'Far from', 'Above'], correctOptionIndex: 0 },
      { question: 'A bird flies over a tree. Where is the bird?', options: ['Under the tree', 'Over the tree', 'Behind the tree'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Position, Direction, and Time', lessonTitle: 'Days of the week',
    equipmentNote: 'none needed — just talk through the days together',
    starterQuiz: [
      { question: 'How many days are there in a week?', options: ['5', '7', '10'], correctOptionIndex: 1 },
      { question: 'What day comes after Monday?', options: ['Sunday', 'Tuesday', 'Wednesday'], correctOptionIndex: 1 },
      { question: 'What is the day before today called?', options: ['Tomorrow', 'Yesterday', 'Today'], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: 'What day comes before Friday?', options: ['Thursday', 'Saturday', 'Sunday'], correctOptionIndex: 0 },
      { question: 'What is the day after today called?', options: ['Yesterday', 'Tomorrow', 'Today'], correctOptionIndex: 1 },
      { question: 'Which is the first day of the week on most calendars?', options: ['Monday', 'Friday', 'Sunday'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 1', subject: 'Mathematics', unitTitle: 'Position, Direction, and Time', lessonTitle: "Introducing o'clock times",
    equipmentNote: 'a clock face (a real clock, toy clock, or drawn on paper)',
    starterQuiz: [
      { question: 'On an "o’clock" time, where does the minute hand point?', options: ['At the 12', 'At the 6', 'Anywhere'], correctOptionIndex: 0, hint: 'The long hand points straight up at o’clock times.' },
      { question: 'Which hand shows the hour?', options: ['The long hand', 'The short hand', 'Neither'], correctOptionIndex: 1 },
      { question: 'If the short hand points to 3 and the long hand to 12, what time is it?', options: ['3 o’clock', '12 o’clock', '6 o’clock'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'What time do you usually wake up for school — closest o’clock?', options: ['7 o’clock', '11 o’clock', 'Midnight'], correctOptionIndex: 0 },
      { question: 'If the short hand points to 8 and the long hand to 12, what time is it?', options: ['8 o’clock', '12 o’clock', '4 o’clock'], correctOptionIndex: 0 },
      { question: 'How many hands does a clock usually have (hour and minute)?', options: ['1', '2', '3'], correctOptionIndex: 1 },
    ],
  },

  // ===== Primary 2 Mathematics =====
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: 'Numbers to 100', lessonTitle: 'Counting in 2s, 5s and 10s',
    equipmentNote: 'a number line or hundred square to 100',
    starterQuiz: [
      { question: 'Counting in 2s from 0: 0, 2, 4, ___?', options: ['5', '6', '8'], correctOptionIndex: 1 },
      { question: 'Counting in 10s from 0: 0, 10, 20, ___?', options: ['25', '30', '40'], correctOptionIndex: 1 },
      { question: 'Counting in 5s from 0: 0, 5, 10, ___?', options: ['12', '15', '20'], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: 'Counting back in 2s from 10: 10, 8, 6, ___?', options: ['4', '5', '7'], correctOptionIndex: 0 },
      { question: 'What is the next number: 20, 30, 40, ___?', options: ['41', '45', '50'], correctOptionIndex: 2 },
      { question: 'What is the next number: 15, 20, 25, ___?', options: ['26', '30', '35'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: 'Numbers to 100', lessonTitle: 'Place value to 100',
    equipmentNote: 'base-10 blocks if you have them, or draw tens and ones',
    starterQuiz: [
      { question: 'In the number 34, how many tens are there?', options: ['3', '4', '34'], correctOptionIndex: 0 },
      { question: 'In the number 52, how many ones are there?', options: ['5', '2', '52'], correctOptionIndex: 1 },
      { question: '2 tens and 5 ones make which number?', options: ['25', '52', '7'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'In the number 78, how many tens are there?', options: ['7', '8', '78'], correctOptionIndex: 0 },
      { question: '6 tens and 3 ones make which number?', options: ['36', '63', '9'], correctOptionIndex: 1 },
      { question: 'Which number has 9 tens and 0 ones?', options: ['9', '90', '900'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: 'Numbers to 100', lessonTitle: 'Ordering and comparing to 100',
    equipmentNote: 'pencil and paper',
    starterQuiz: [
      { question: 'What does the < sign mean?', options: ['Greater than', 'Less than', 'Equal to'], correctOptionIndex: 1 },
      { question: 'Which is greater: 45 or 54?', options: ['45', '54', 'Equal'], correctOptionIndex: 1 },
      { question: 'What does the > sign mean?', options: ['Greater than', 'Less than', 'Equal to'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Which is smaller: 67 or 76?', options: ['67', '76', 'Equal'], correctOptionIndex: 0 },
      { question: 'Fill in the sign: 38 __ 83', options: ['<', '>', '='], correctOptionIndex: 0 },
      { question: 'Order 12, 21, 9 from smallest — what comes first?', options: ['9', '12', '21'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: 'Addition and Subtraction within 100', lessonTitle: 'Adding a 1-digit number to a 2-digit number',
    equipmentNote: 'pencil and paper, or a number line to 100',
    starterQuiz: [
      { question: 'What is 23 + 4?', options: ['26', '27', '28'], correctOptionIndex: 1 },
      { question: 'What is 19 + 5?', options: ['23', '24', '25'], correctOptionIndex: 1, hint: 'This crosses a tens boundary — 19 + 1 = 20, then add 4 more.' },
      { question: 'What is 40 + 7?', options: ['47', '48', '37'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'What is 36 + 8?', options: ['42', '43', '44'], correctOptionIndex: 2 },
      { question: 'What is 55 + 6?', options: ['60', '61', '62'], correctOptionIndex: 1 },
      { question: 'What is 72 + 3?', options: ['74', '75', '76'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: 'Addition and Subtraction within 100', lessonTitle: 'Adding two 2-digit numbers',
    equipmentNote: 'pencil and paper for jottings',
    starterQuiz: [
      { question: 'What is 23 + 15?', options: ['36', '37', '38'], correctOptionIndex: 2 },
      { question: 'A good strategy for 34 + 22 is to add the...', options: ['Tens then the ones', 'Ones only', 'Nothing, just guess'], correctOptionIndex: 0 },
      { question: 'What is 40 + 30?', options: ['60', '70', '80'], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: 'What is 45 + 34?', options: ['77', '78', '79'], correctOptionIndex: 2 },
      { question: 'What is 26 + 26?', options: ['50', '51', '52'], correctOptionIndex: 2 },
      { question: 'What is 18 + 27?', options: ['44', '45', '46'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: 'Addition and Subtraction within 100', lessonTitle: 'Subtracting within 100',
    equipmentNote: 'pencil and paper for jottings',
    starterQuiz: [
      { question: 'What is 45 − 3?', options: ['41', '42', '43'], correctOptionIndex: 1 },
      { question: 'What is 30 − 12?', options: ['16', '17', '18'], correctOptionIndex: 2 },
      { question: 'How can you check a subtraction answer?', options: ['Add it back up', 'Ignore it', 'Guess again'], correctOptionIndex: 0, hint: 'Adding your answer back to the number you subtracted should give the start number.' },
    ],
    exitQuiz: [
      { question: 'What is 62 − 8?', options: ['53', '54', '55'], correctOptionIndex: 1 },
      { question: 'What is 50 − 26?', options: ['22', '23', '24'], correctOptionIndex: 2 },
      { question: 'What is 78 − 45?', options: ['32', '33', '34'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: 'Introducing Multiplication and Division', lessonTitle: 'Equal groups and arrays',
    equipmentNote: 'small objects to arrange into equal rows',
    starterQuiz: [
      { question: '3 groups of 4 objects is the same as which repeated addition?', options: ['4+4+4', '3+3+3+3', '4+3'], correctOptionIndex: 0 },
      { question: 'An array arranges objects into...', options: ['Rows and columns', 'One long line', 'A circle'], correctOptionIndex: 0 },
      { question: '2 rows of 5 in an array make how many objects?', options: ['7', '10', '12'], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: '4 groups of 3 objects makes how many altogether?', options: ['7', '12', '15'], correctOptionIndex: 1 },
      { question: '3 rows of 3 in an array make how many objects?', options: ['6', '9', '12'], correctOptionIndex: 1 },
      { question: 'Multiplication can be thought of as repeated...', options: ['Subtraction', 'Addition', 'Comparison'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: 'Introducing Multiplication and Division', lessonTitle: 'The 2, 5 and 10 times tables',
    equipmentNote: 'none needed — practise reciting together',
    starterQuiz: [
      { question: 'What is 2 x 4?', options: ['6', '8', '10'], correctOptionIndex: 1 },
      { question: 'What is 5 x 3?', options: ['10', '15', '20'], correctOptionIndex: 1 },
      { question: 'What is 10 x 6?', options: ['16', '60', '600'], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: 'What is 2 x 8?', options: ['14', '16', '18'], correctOptionIndex: 1 },
      { question: 'What is 5 x 7?', options: ['30', '35', '40'], correctOptionIndex: 1 },
      { question: 'What is 10 x 9?', options: ['19', '90', '99'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: 'Introducing Multiplication and Division', lessonTitle: 'Sharing and grouping',
    equipmentNote: 'small objects to share into equal piles',
    starterQuiz: [
      { question: 'Sharing 6 sweets equally between 2 people — how many each?', options: ['2', '3', '4'], correctOptionIndex: 1 },
      { question: 'Division as "grouping" means...', options: ['Making equal-sized groups from a total', 'Adding groups together', 'Comparing two groups'], correctOptionIndex: 0 },
      { question: 'Sharing 10 apples between 5 baskets — how many per basket?', options: ['1', '2', '5'], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: 'Sharing 12 pencils equally between 3 children — how many each?', options: ['3', '4', '6'], correctOptionIndex: 1 },
      { question: 'Grouping 15 objects into groups of 5 — how many groups?', options: ['2', '3', '5'], correctOptionIndex: 1 },
      { question: 'Sharing 8 stickers between 4 friends — how many each?', options: ['1', '2', '4'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: 'Fractions: Halves and Quarters', lessonTitle: 'Halves and quarters of shapes',
    equipmentNote: 'a piece of paper to fold in half and quarters',
    starterQuiz: [
      { question: 'If you fold a piece of paper exactly in half, how many equal parts do you get?', options: ['2', '3', '4'], correctOptionIndex: 0 },
      { question: 'A quarter is the same as how many equal parts of a whole?', options: ['2', '3', '4'], correctOptionIndex: 2 },
      { question: 'For parts to be "halves", they must be...', options: ['Equal in size', 'Any size', 'Different colours'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'A pizza cut into 4 equal slices — each slice is a...', options: ['Half', 'Quarter', 'Third'], correctOptionIndex: 1 },
      { question: 'A chocolate bar split into 2 equal pieces — each piece is a...', options: ['Half', 'Quarter', 'Whole'], correctOptionIndex: 0 },
      { question: 'How many quarters make one whole?', options: ['2', '3', '4'], correctOptionIndex: 2 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: 'Fractions: Halves and Quarters', lessonTitle: 'Halves and quarters of quantities',
    equipmentNote: '8 or so small objects (sweets, counters) to split into equal groups',
    starterQuiz: [
      { question: 'Half of 8 objects is how many?', options: ['2', '4', '6'], correctOptionIndex: 1 },
      { question: 'A quarter of 8 objects is how many?', options: ['2', '4', '8'], correctOptionIndex: 0 },
      { question: 'Half of 10 is...', options: ['4', '5', '6'], correctOptionIndex: 1 },
    ],
    exitQuiz: [
      { question: 'Half of 12 is...', options: ['5', '6', '7'], correctOptionIndex: 1 },
      { question: 'A quarter of 12 is...', options: ['3', '4', '6'], correctOptionIndex: 0 },
      { question: 'Half of 20 is...', options: ['8', '10', '12'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: '2D and 3D Shape Properties', lessonTitle: 'Properties of 2D shapes',
    equipmentNote: 'a few 2D shapes to count sides and corners on',
    starterQuiz: [
      { question: 'How many corners does a square have?', options: ['3', '4', '5'], correctOptionIndex: 1 },
      { question: 'How many corners does a triangle have?', options: ['2', '3', '4'], correctOptionIndex: 1 },
      { question: 'A pentagon has how many sides?', options: ['4', '5', '6'], correctOptionIndex: 1, hint: '"Penta" means five.' },
    ],
    exitQuiz: [
      { question: 'How many sides and corners does a hexagon have?', options: ['5 and 5', '6 and 6', '7 and 7'], correctOptionIndex: 1 },
      { question: 'Which shape has 4 sides and 4 corners, all sides equal?', options: ['Square', 'Triangle', 'Pentagon'], correctOptionIndex: 0 },
      { question: 'A shape with no corners at all is a...', options: ['Circle', 'Square', 'Triangle'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: '2D and 3D Shape Properties', lessonTitle: 'Properties of 3D shapes',
    equipmentNote: 'a cube-shaped object (box or dice) to count faces, edges, corners',
    starterQuiz: [
      { question: 'How many faces does a cube have?', options: ['4', '6', '8'], correctOptionIndex: 1 },
      { question: 'What is a "face" on a 3D shape?', options: ['A flat surface', 'A corner', 'An edge'], correctOptionIndex: 0 },
      { question: 'What is an "edge" on a 3D shape?', options: ['Where two faces meet', 'A flat surface', 'A round part'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'How many corners does a cube have?', options: ['6', '8', '10'], correctOptionIndex: 1 },
      { question: 'How many edges does a cube have?', options: ['10', '12', '14'], correctOptionIndex: 1 },
      { question: 'A sphere has how many flat faces?', options: ['0', '1', '6'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: '2D and 3D Shape Properties', lessonTitle: 'Symmetry',
    equipmentNote: 'a shape or letter to fold in half to check for symmetry, and a mirror if you have one',
    starterQuiz: [
      { question: 'A shape is symmetrical if you can fold it and both halves...', options: ['Look different', 'Match exactly', 'Overlap partly'], correctOptionIndex: 1 },
      { question: 'The fold line in a symmetrical shape is called the line of...', options: ['Symmetry', 'Direction', 'Measurement'], correctOptionIndex: 0 },
      { question: 'Does a circle have a line of symmetry?', options: ['Yes', 'No', 'Only sometimes'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Does the letter "A" have a line of symmetry (drawn simply)?', options: ['Yes', 'No'], correctOptionIndex: 0 },
      { question: 'A butterfly’s wings are usually an example of...', options: ['Symmetry', 'Randomness', 'Nothing special'], correctOptionIndex: 0 },
      { question: 'How many lines of symmetry does a square have?', options: ['1', '2', '4'], correctOptionIndex: 2 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: 'Measures with Standard Units', lessonTitle: 'Measuring length in cm and m',
    equipmentNote: 'a ruler or tape measure',
    starterQuiz: [
      { question: 'Which unit measures a pencil’s length?', options: ['Centimetres', 'Kilograms', 'Litres'], correctOptionIndex: 0 },
      { question: 'Which unit is better for measuring a room’s length?', options: ['Centimetres', 'Metres', 'Grams'], correctOptionIndex: 1 },
      { question: 'What tool measures length?', options: ['A ruler', 'A clock', 'A scale'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'A pencil measures about 15... what?', options: ['cm', 'm', 'kg'], correctOptionIndex: 0 },
      { question: 'A school corridor is measured in...', options: ['cm', 'm', 'litres'], correctOptionIndex: 1 },
      { question: 'Which is longer: 1 metre or 1 centimetre?', options: ['1 metre', '1 centimetre', 'Same'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: 'Measures with Standard Units', lessonTitle: 'Measuring mass and capacity',
    equipmentNote: 'kitchen scales and a measuring jug, if available',
    starterQuiz: [
      { question: 'Which unit measures how heavy something is?', options: ['Grams', 'Centimetres', 'Litres'], correctOptionIndex: 0 },
      { question: 'Which unit measures how much liquid a bottle holds?', options: ['Grams', 'Millilitres', 'Metres'], correctOptionIndex: 1 },
      { question: 'A bag of sugar might weigh about 1... what?', options: ['Kilogram', 'Litre', 'Metre'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'A bottle of water might hold about 1... what?', options: ['Litre', 'Kilogram', 'Centimetre'], correctOptionIndex: 0 },
      { question: 'Which unit is used for a small amount of medicine liquid?', options: ['Millilitres', 'Kilograms', 'Metres'], correctOptionIndex: 0 },
      { question: 'Which tool measures mass?', options: ['Scales', 'A ruler', 'A jug'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: 'Measures with Standard Units', lessonTitle: 'Telling time to the half and quarter hour',
    equipmentNote: 'a clock face (real, toy, or drawn)',
    starterQuiz: [
      { question: 'At half past the hour, where does the minute hand point?', options: ['At the 12', 'At the 6', 'At the 3'], correctOptionIndex: 1 },
      { question: 'At quarter past the hour, where does the minute hand point?', options: ['At the 3', 'At the 6', 'At the 9'], correctOptionIndex: 0 },
      { question: 'At quarter to the hour, where does the minute hand point?', options: ['At the 3', 'At the 6', 'At the 9'], correctOptionIndex: 2 },
    ],
    exitQuiz: [
      { question: 'The minute hand is at the 6 and the hour hand is between 4 and 5. What time is it?', options: ['Half past 4', 'Quarter past 4', 'Quarter to 5'], correctOptionIndex: 0 },
      { question: 'How many minutes are in half an hour?', options: ['15', '30', '45'], correctOptionIndex: 1 },
      { question: 'How many minutes are in a quarter of an hour?', options: ['10', '15', '20'], correctOptionIndex: 1 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: 'Handling Data', lessonTitle: 'Pictograms and block graphs',
    equipmentNote: 'pencil and paper to draw a simple pictogram',
    starterQuiz: [
      { question: 'A pictogram uses pictures to show...', options: ['Data/amounts', 'Colours only', 'Nothing useful'], correctOptionIndex: 0 },
      { question: 'In a block graph, taller blocks usually mean...', options: ['Less', 'More', 'The same'], correctOptionIndex: 1 },
      { question: 'What do you need to read a pictogram correctly?', options: ['The key', 'A ruler', 'A clock'], correctOptionIndex: 0, hint: 'The key tells you how much each picture stands for.' },
    ],
    exitQuiz: [
      { question: 'If each picture = 2 pets, and there are 3 pictures, how many pets?', options: ['3', '5', '6'], correctOptionIndex: 2 },
      { question: 'In a block graph of favourite fruits, the tallest bar shows the...', options: ['Least popular fruit', 'Most popular fruit', 'Newest fruit'], correctOptionIndex: 1 },
      { question: 'Why do we collect and show data?', options: ['To answer questions about it', 'For no reason', 'To make it disappear'], correctOptionIndex: 0 },
    ],
  },
  {
    className: 'Primary 2', subject: 'Mathematics', unitTitle: 'Handling Data', lessonTitle: 'Sorting with diagrams',
    equipmentNote: 'small objects or number cards to sort into groups',
    starterQuiz: [
      { question: 'A sorting diagram helps you group things by their...', options: ['Properties', 'Colour only', 'Nothing'], correctOptionIndex: 0 },
      { question: 'If sorting "red" and "not red", where does a blue object go?', options: ['Red', 'Not red', 'Neither'], correctOptionIndex: 1 },
      { question: 'A Venn diagram usually uses...', options: ['Overlapping circles', 'Straight lines only', 'No shapes'], correctOptionIndex: 0 },
    ],
    exitQuiz: [
      { question: 'Sorting numbers into "even" and "odd" — where does 8 go?', options: ['Even', 'Odd', 'Neither'], correctOptionIndex: 0 },
      { question: 'Sorting shapes into "has 4 sides" and "does not" — where does a triangle go?', options: ['Has 4 sides', 'Does not', 'Both'], correctOptionIndex: 1 },
      { question: 'What is useful about sorting objects into a diagram?', options: ['It shows how things are grouped', 'It hides information', 'It is not useful'], correctOptionIndex: 0 },
    ],
  },
];
