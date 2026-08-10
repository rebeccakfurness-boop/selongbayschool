import type { SampleTermSeed } from './curriculum-seed-types';

/** Draft first-term Mathematics content for Primary 1–6, organised around the Cambridge Primary
 * Mathematics curriculum framework's stage-by-stage progression through its strands (Number;
 * Geometry and Measure; Statistics and Probability). Original lesson-plan writing informed by the
 * publicly known structure of that framework, not a reproduction of Cambridge's own copyrighted
 * materials — see curriculum-seed.ts for the full explanation of why every one of these is
 * explicitly a draft. Primary 1 maps to Cambridge Primary Stage 1, Primary 2 to Stage 2, and so on.
 */
export const MATHEMATICS_TERMS: SampleTermSeed[] = [
  {
    className: 'Primary 1',
    subject: 'Mathematics',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary Mathematics, Stage 1 (draft)',
    units: [
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
    ],
  },
  {
    className: 'Primary 2',
    subject: 'Mathematics',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary Mathematics, Stage 2 (draft)',
    units: [
      {
        title: 'Numbers to 100',
        description: 'Extending place value understanding to two-digit numbers.',
        lessons: [
          { title: 'Counting in 2s, 5s and 10s', objectives: 'Count on and back in steps of 2, 5, and 10 from any small starting number.' },
          { title: 'Place value to 100', objectives: 'Understand a two-digit number as a number of tens and ones, and represent it with base-10 blocks.' },
          { title: 'Ordering and comparing to 100', objectives: 'Order numbers to 100 and use the < and > signs to compare two numbers.' },
        ],
      },
      {
        title: 'Addition and Subtraction within 100',
        description: 'Moving from within-10 fluency to two-digit calculation.',
        lessons: [
          { title: 'Adding a 1-digit number to a 2-digit number', objectives: 'Add a one-digit number to a two-digit number, with and without crossing a tens boundary.' },
          { title: 'Adding two 2-digit numbers', objectives: 'Add two two-digit numbers using a mental or jottings-based strategy.' },
          { title: 'Subtracting within 100', objectives: 'Subtract a one-digit or two-digit number from a two-digit number, using the inverse to check.' },
        ],
      },
      {
        title: 'Introducing Multiplication and Division',
        description: 'Building the idea of equal groups before formal times tables.',
        lessons: [
          { title: 'Equal groups and arrays', objectives: 'Understand multiplication as repeated addition of equal groups, using arrays to show this.' },
          { title: 'The 2, 5 and 10 times tables', objectives: 'Recall multiplication and division facts for the 2, 5, and 10 times tables.' },
          { title: 'Sharing and grouping', objectives: 'Understand division as sharing into equal groups and as grouping, using objects.' },
        ],
      },
      {
        title: 'Fractions: Halves and Quarters',
        description: 'A first, concrete introduction to fractions of shapes and quantities.',
        lessons: [
          { title: 'Halves and quarters of shapes', objectives: 'Find half and a quarter of a shape by folding or dividing it into equal parts.' },
          { title: 'Halves and quarters of quantities', objectives: 'Find half and a quarter of a small quantity of objects.' },
        ],
      },
      {
        title: '2D and 3D Shape Properties',
        description: 'Describing shapes by their properties, not just their appearance.',
        lessons: [
          { title: 'Properties of 2D shapes', objectives: 'Describe 2D shapes by their number of sides and corners.' },
          { title: 'Properties of 3D shapes', objectives: 'Describe 3D shapes by their number of faces, edges, and corners.' },
          { title: 'Symmetry', objectives: 'Identify a line of symmetry in a simple 2D shape or pattern.' },
        ],
      },
      {
        title: 'Measures with Standard Units',
        description: 'Moving from direct comparison to standard units for the first time.',
        lessons: [
          { title: 'Measuring length in cm and m', objectives: 'Measure and compare lengths using centimetres and metres, choosing an appropriate tool.' },
          { title: 'Measuring mass and capacity', objectives: 'Measure mass in grams and kilograms, and capacity in millilitres and litres, using simple scales.' },
          { title: 'Telling time to the half and quarter hour', objectives: "Read and draw times to the half hour and quarter hour on an analogue clock." },
        ],
      },
      {
        title: 'Handling Data',
        description: 'A first introduction to organising and reading simple data.',
        lessons: [
          { title: 'Pictograms and block graphs', objectives: 'Collect simple data and represent it in a pictogram or block graph, then answer questions about it.' },
          { title: 'Sorting with diagrams', objectives: 'Sort objects or numbers using a simple Venn or Carroll diagram.' },
        ],
      },
    ],
  },
  {
    className: 'Primary 3',
    subject: 'Mathematics',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary Mathematics, Stage 3 (draft)',
    units: [
      {
        title: 'Numbers to 1000',
        description: 'Extending place value to three digits and introducing rounding.',
        lessons: [
          { title: 'Place value to 1000', objectives: 'Understand hundreds, tens and ones in a three-digit number, and partition numbers accordingly.' },
          { title: 'Ordering numbers to 1000', objectives: 'Compare and order numbers to 1000 using place value.' },
          { title: 'Rounding to the nearest 10', objectives: 'Round a two- or three-digit number to the nearest 10.' },
        ],
      },
      {
        title: 'Written Addition and Subtraction',
        description: 'Moving from mental strategies to a first formal written method.',
        lessons: [
          { title: 'Adding 2-digit and 3-digit numbers', objectives: 'Use an expanded written method to add two- and three-digit numbers, including where regrouping is needed.' },
          { title: 'Subtracting 2-digit and 3-digit numbers', objectives: 'Use an expanded written method to subtract two- and three-digit numbers, including where regrouping is needed.' },
        ],
      },
      {
        title: 'Multiplication and Division',
        description: 'Extending times-table knowledge and introducing division with remainders.',
        lessons: [
          { title: 'The 3, 4 and 8 times tables', objectives: 'Recall multiplication and division facts for the 3, 4, and 8 times tables.' },
          { title: 'Multiplying 2-digit by 1-digit numbers', objectives: 'Multiply a two-digit number by a one-digit number using a grid or expanded method.' },
          { title: 'Division with remainders', objectives: 'Divide a two-digit number by a one-digit number, interpreting any remainder in context.' },
        ],
      },
      {
        title: 'Fractions',
        description: 'Extending fraction understanding to thirds and simple equivalence.',
        lessons: [
          { title: 'Thirds and other fractions', objectives: 'Find thirds, quarters, and other simple fractions of shapes and quantities.' },
          { title: 'Equivalent fractions', objectives: 'Recognise simple equivalent fractions, such as two quarters and a half, using a fraction wall.' },
        ],
      },
      {
        title: 'Shape, Angles and Perimeter',
        description: 'Introducing angles and measuring around shapes for the first time.',
        lessons: [
          { title: 'Right angles', objectives: 'Identify right angles in 2D shapes and the environment, and compare other angles to a right angle.' },
          { title: 'Perimeter of simple shapes', objectives: 'Measure and calculate the perimeter of simple rectilinear shapes.' },
        ],
      },
      {
        title: 'Measures and Time',
        description: 'Reading scales more precisely and extending time-telling skills.',
        lessons: [
          { title: 'Reading scales', objectives: 'Read a scale accurately to the nearest labelled division on a range of measuring instruments.' },
          { title: 'Time to the nearest 5 minutes', objectives: 'Read and record time to the nearest 5 minutes on an analogue clock.' },
          { title: 'Introducing the 24-hour clock', objectives: 'Recognise 24-hour clock times and relate them to familiar 12-hour times.' },
        ],
      },
      {
        title: 'Handling Data',
        description: 'Moving from pictograms to bar charts and two-way sorting.',
        lessons: [
          { title: 'Bar charts', objectives: 'Collect data and represent it in a labelled bar chart, then interpret it to answer questions.' },
          { title: 'Venn diagrams with two criteria', objectives: 'Sort a set of objects or numbers using a Venn diagram with two overlapping criteria.' },
        ],
      },
    ],
  },
  {
    className: 'Primary 4',
    subject: 'Mathematics',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary Mathematics, Stage 4 (draft)',
    units: [
      {
        title: 'Numbers to 10,000',
        description: 'Extending place value to four digits and introducing negative numbers in context.',
        lessons: [
          { title: 'Place value to 10,000', objectives: 'Understand thousands, hundreds, tens and ones in a four-digit number, and partition it accordingly.' },
          { title: 'Rounding to the nearest 100', objectives: 'Round a three- or four-digit number to the nearest 100.' },
          { title: 'Negative numbers in context', objectives: 'Recognise negative numbers in real-life contexts such as temperature, and order them on a number line.' },
        ],
      },
      {
        title: 'Written Addition and Subtraction',
        description: 'Consolidating and extending formal written methods to four-digit numbers.',
        lessons: [
          { title: 'Formal column addition', objectives: 'Use formal column addition to add two four-digit numbers, including where regrouping is needed.' },
          { title: 'Formal column subtraction', objectives: 'Use formal column subtraction to subtract a four-digit number from another, including where regrouping is needed.' },
        ],
      },
      {
        title: 'Multiplication and Division',
        description: 'Completing knowledge of times tables to 12x12 and formal short multiplication.',
        lessons: [
          { title: 'Times tables to 12x12', objectives: 'Recall and use multiplication and division facts for all times tables up to 12x12.' },
          { title: 'Multiplying and dividing by 10 and 100', objectives: 'Multiply and divide whole numbers by 10 and 100, understanding the effect on place value.' },
          { title: 'Formal short multiplication', objectives: 'Use formal short multiplication to multiply a two- or three-digit number by a one-digit number.' },
        ],
      },
      {
        title: 'Fractions and Decimals',
        description: 'Introducing tenths and the link between fractions and decimals.',
        lessons: [
          { title: 'Tenths', objectives: 'Recognise and represent tenths as fractions and understand their link to place value.' },
          { title: 'Decimal notation', objectives: 'Read and write decimal numbers with one decimal place, relating them to tenths.' },
          { title: 'Fraction and decimal equivalence', objectives: 'Recognise simple equivalences between fractions and one-decimal-place numbers.' },
        ],
      },
      {
        title: 'Shape, Angles and Symmetry',
        description: 'Classifying angles and exploring 3D shape nets.',
        lessons: [
          { title: 'Classifying angles', objectives: 'Identify and classify acute, right, and obtuse angles.' },
          { title: 'Symmetry in 2D shapes', objectives: 'Identify all lines of symmetry in a range of 2D shapes.' },
          { title: 'Nets of 3D shapes', objectives: 'Recognise and construct simple nets of common 3D shapes such as a cube and cuboid.' },
        ],
      },
      {
        title: 'Measures and Timetables',
        description: 'Introducing area informally and working with real timetables.',
        lessons: [
          { title: 'Area by counting squares', objectives: 'Find the area of a simple shape by counting whole and half squares on a grid.' },
          { title: 'Converting units of length', objectives: 'Convert between centimetres and metres, and between millimetres and centimetres.' },
          { title: 'Reading timetables', objectives: 'Read and interpret a simple timetable, calculating durations between two times.' },
        ],
      },
      {
        title: 'Handling Data',
        description: 'Organising larger data sets and introducing line graphs.',
        lessons: [
          { title: 'Frequency tables', objectives: 'Collect and organise data into a frequency table.' },
          { title: 'Line graphs', objectives: 'Read and interpret a line graph showing change over time, such as temperature.' },
        ],
      },
    ],
  },
  {
    className: 'Primary 5',
    subject: 'Mathematics',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary Mathematics, Stage 5 (draft)',
    units: [
      {
        title: 'Numbers to 100,000',
        description: 'Extending place value further and introducing prime and square numbers.',
        lessons: [
          { title: 'Place value to 100,000', objectives: 'Understand and use place value in numbers up to 100,000, including rounding to the nearest 1000.' },
          { title: 'Prime numbers', objectives: 'Identify prime numbers up to 20 by testing for factors.' },
          { title: 'Square numbers', objectives: 'Recognise and calculate square numbers up to 12 squared.' },
        ],
      },
      {
        title: 'The Four Operations',
        description: 'Consolidating formal written methods across all four operations, including negative numbers.',
        lessons: [
          { title: 'Formal written addition and subtraction', objectives: 'Use formal column methods fluently for addition and subtraction of numbers with up to five digits.' },
          { title: 'Long multiplication', objectives: 'Multiply a three-digit number by a two-digit number using a formal written method.' },
          { title: 'Negative number arithmetic', objectives: 'Add and subtract across zero using negative numbers in context.' },
        ],
      },
      {
        title: 'Fractions, Decimals and Percentages',
        description: 'Bringing the three representations together for the first time.',
        lessons: [
          { title: 'Equivalence between fractions, decimals and percentages', objectives: 'Convert fluently between simple fractions, decimals, and percentages (e.g. 1/2, 0.5, 50%).' },
          { title: 'Decimals to two places', objectives: 'Read, write, and order decimal numbers with up to two decimal places.' },
          { title: 'Percentage of a quantity', objectives: 'Find simple percentages (10%, 25%, 50%) of a quantity.' },
        ],
      },
      {
        title: 'Ratio and Proportion',
        description: 'A first introduction using familiar, real-life contexts.',
        lessons: [
          { title: 'Introducing ratio', objectives: 'Use the language of ratio to describe the relationship between two quantities in a real-life context, such as a recipe.' },
          { title: 'Simple proportion problems', objectives: 'Solve simple proportion problems, such as scaling a recipe up or down.' },
        ],
      },
      {
        title: 'Shape, Angles, Area and Perimeter',
        description: 'Calculating angles and the area of rectangles and compound shapes.',
        lessons: [
          { title: 'Angles on a line and at a point', objectives: 'Calculate missing angles on a straight line and at a point, knowing they total 180° and 360°.' },
          { title: 'Area and perimeter of rectangles', objectives: 'Calculate the area and perimeter of rectangles using formulae.' },
          { title: 'Area of compound shapes', objectives: 'Calculate the area of a compound shape made from two or more rectangles.' },
        ],
      },
      {
        title: 'Measures',
        description: 'Converting confidently between metric units.',
        lessons: [
          { title: 'Converting metric units', objectives: 'Convert between related metric units of length, mass, and capacity.' },
          { title: 'Reading and interpreting scales', objectives: 'Read a range of scales accurately, including those with unlabelled intervals.' },
        ],
      },
      {
        title: 'Handling Data',
        description: 'Introducing averages and comparing two data sets.',
        lessons: [
          { title: 'The mean average', objectives: 'Calculate the mean of a small set of data and understand what it represents.' },
          { title: 'Line graphs with two data sets', objectives: 'Read and compare two data sets shown on the same line graph.' },
        ],
      },
    ],
  },
  {
    className: 'Primary 6',
    subject: 'Mathematics',
    termLabel: 'Term 1 (draft)',
    frameworkLabel: 'Cambridge Primary Mathematics, Stage 6 (draft)',
    units: [
      {
        title: 'Numbers to 1,000,000',
        description: 'Working with large numbers and exploring factors and multiples in depth.',
        lessons: [
          { title: 'Place value to 1,000,000', objectives: 'Read, write, and order numbers up to one million.' },
          { title: 'Factors, multiples and prime factorisation', objectives: 'Find all the factors of a number, identify common multiples, and express a number as a product of its prime factors.' },
        ],
      },
      {
        title: 'The Four Operations with Decimals',
        description: 'Extending formal written methods to include decimal numbers and order of operations.',
        lessons: [
          { title: 'Adding and subtracting decimals', objectives: 'Add and subtract numbers with up to three decimal places using a formal written method.' },
          { title: 'Multiplying and dividing decimals', objectives: 'Multiply and divide decimal numbers by whole numbers.' },
          { title: 'Order of operations', objectives: 'Use the correct order of operations (brackets, multiplication/division, addition/subtraction) in calculations with more than one step.' },
        ],
      },
      {
        title: 'Fractions, Decimals, Percentages and Ratio',
        description: 'Fluent conversion between forms and solving proportional-reasoning problems.',
        lessons: [
          { title: 'Fluent conversion between forms', objectives: 'Convert fluently between fractions, decimals, and percentages for a wide range of values.' },
          { title: 'Percentage increase and decrease', objectives: 'Calculate a percentage increase or decrease of a given amount.' },
          { title: 'Ratio and proportion problem-solving', objectives: 'Solve problems involving ratio and direct proportion in real-life contexts.' },
        ],
      },
      {
        title: 'Introducing Algebra',
        description: 'A first, gentle introduction to representing the unknown.',
        lessons: [
          { title: 'Using letters for unknowns', objectives: 'Use a letter to represent an unknown number in a simple equation and find its value.' },
          { title: 'Simple formulae and sequences', objectives: 'Use a simple formula expressed in words or symbols, and continue a number sequence following a given rule.' },
        ],
      },
      {
        title: 'Shape, Angles and Position',
        description: 'Angles in polygons and coordinates across all four quadrants.',
        lessons: [
          { title: 'Angles in triangles and quadrilaterals', objectives: 'Calculate missing angles in triangles and quadrilaterals, knowing their angle sums.' },
          { title: 'Coordinates in four quadrants', objectives: 'Plot and read coordinates in all four quadrants of a coordinate grid.' },
          { title: 'Area of triangles', objectives: 'Calculate the area of a triangle using the formula half base times height.' },
        ],
      },
      {
        title: 'Measures',
        description: 'Circles, volume, and compound measures for the first time.',
        lessons: [
          { title: 'Circumference and area of circles', objectives: 'Calculate the circumference and area of a circle given its radius or diameter.' },
          { title: 'Volume of cuboids', objectives: 'Calculate the volume of a cuboid using the formula length times width times height.' },
        ],
      },
      {
        title: 'Handling Data',
        description: 'A fuller statistical toolkit before moving to secondary school.',
        lessons: [
          { title: 'Mean, median, mode and range', objectives: 'Calculate the mean, median, mode, and range of a data set and know when each is most useful.' },
          { title: 'Pie charts', objectives: 'Read and interpret a pie chart, and construct a simple one from given data.' },
          { title: 'Introducing probability', objectives: 'Use the language of probability (impossible, unlikely, even chance, likely, certain) to describe simple events.' },
        ],
      },
    ],
  },
];
