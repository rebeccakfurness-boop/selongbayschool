import type { WorksheetContent, WorksheetQuestion } from '../types';

/** Port of DASHBOARDSPEC.md's worksheets.py, reinterpreted for this app's existing
 * WorksheetContent shape ({title, instructions?, questions: [{prompt, marks?, answer?}]}) instead
 * of the spec's raw-HTML task blocks -- the same docx/PDF renderer every other import path
 * already uses (./worksheet-files) only understands prompt/marks/answer, not free-form markup, so
 * each of the spec's HTML builders (lines/boxes/draw_area/count_row/sums/tick_list/table/grid/...)
 * becomes one or more plain-text questions instead. The two rules the spec calls out are kept
 * exactly: content follows the lesson (number_range() reads the lesson's own title) and words are
 * real (phonicsWords() builds decodable words from the lesson's own letters/rimes/digraphs). */

/** Deterministic PRNG seeded per lesson (mulberry32) -- not the same algorithm as Python's
 * random.Random, so output isn't byte-identical to the reference build, but it gives the same
 * property that mattered: neighbouring worksheets differ, the same lesson rebuilds identically. */
class SeededRandom {
  private state: number;
  constructor(seed: string) {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    this.state = h >>> 0;
  }
  private next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  randint(lo: number, hi: number): number {
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }
  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  sample<T>(arr: T[], n: number): T[] {
    const pool = [...arr];
    const out: T[] = [];
    for (let i = 0; i < n && pool.length > 0; i++) {
      const idx = Math.floor(this.next() * pool.length);
      out.push(pool.splice(idx, 1)[0]);
    }
    return out;
  }
}

// --------------------------------------------------------------------------
// Real decodable words, chosen to match the phonics focus of the lesson
// --------------------------------------------------------------------------
const CVC =
  `sat sit set sap sip tap tip top tin tan ten tag tug pat pit pin pan pop pup pug pet
   nap nip net nut nod man map mat men mud mug mop dad dig dog dot dip did den bad bag bat bed
   bet big bin bit bun bus but cat cap can cot cup cub fan fat fig fit fog fun gap get
   got gum hat hen hit hop hot hug hum jam jet jog jug kid kit lap led leg lid lip lot log rag
   ram ran rat red rib rig rip rob rub run rug sun six wag web wet wig win zip`
    .split(/\s+/)
    .filter(Boolean);

const DIGRAPH =
  `chip chin chop chat shop ship shed shin thin this that ring king sing wing bath
   path fish dish rush much such lunch bench`
    .split(/\s+/)
    .filter(Boolean);

const CLUSTER =
  `flag flat clap clip glad plan plum slip slug snap spin stop step stem swim skip
   scan trap trip drip drum frog from grab grin crab crop brush brick stand plant jump lamp
   hand land sand bend nest best mask desk milk help`
    .split(/\s+/)
    .filter(Boolean);

const LONGV =
  `cake make lake name game gate late bike like time nine ride side rope note home
   bone hope rose cube tube June rule tree feet seen keep week meet rain tail wait pain boat
   road coat soap high light night play day say`
    .split(/\s+/)
    .filter(Boolean);

const HFW: Record<number, string[]> = {
  1: 'the and a to said in he I of it'.split(' '),
  2: 'was you they on she is for at his but'.split(' '),
  3: 'that with all we can are up had my her'.split(' '),
  4: 'what there out this have went be like some so'.split(' '),
};

/** Six words a child could actually decode after this lesson -- direct port of phonics_words(). */
function phonicsWords(rng: SeededRandom, focus: string, n = 6): string[] {
  const setMatch = focus.match(/set (\d)/);
  if (focus.includes('high frequency') && setMatch) {
    const words = HFW[Number(setMatch[1])] ?? HFW[1];
    return words.slice(0, n);
  }

  const rimes = [...focus.matchAll(/-([a-z]{2,3})\b/g)].map((m) => m[1]);
  if (rimes.length > 0) {
    const out = CVC.filter((w) => rimes.some((r) => w.endsWith(r)));
    if (out.length >= n) return rng.sample(out, n);
  }

  let pool: string[];
  if (/digraph|ch sh th ng|ff ll ss/.test(focus)) {
    pool = DIGRAPH;
  } else if (/cluster|ccvc|cvcc/.test(focus)) {
    pool = CLUSTER;
  } else if (/long vowel|a-e|i-e|o-e|u-e|alternative spelling|ai|ee|igh|oa|ay|ea|ow/.test(focus)) {
    pool = LONGV;
  } else {
    const letters = new Set([...focus.matchAll(/\b([a-z])\b/g)].map((m) => m[1]));
    pool = letters.size > 0 ? CVC.filter((w) => [...w].every((c) => letters.has(c) || 'aeiou'.includes(c))) : [];
    if (pool.length < n) {
      pool = letters.size === 0 ? CVC : CVC.filter((w) => [...w].some((c) => letters.has(c)));
      if (pool.length === 0) pool = CVC;
    }
  }
  return rng.sample(pool, Math.min(n, pool.length));
}

/** The largest number a lesson should use, read from its own title -- direct port of
 * number_range(): "Counting objects to 5" never exceeds 5, "Addition within 20" uses 20. */
export function numberRange(title: string, fallback = 10): number {
  const m = title.match(/\b(?:to|within|beyond)\s+(\d+)/);
  if (m) return Math.min(Number(m[1]), 20);
  if (/\bteen|to 20|within 20/.test(title)) return 20;
  return fallback;
}

function dotsStr(n: number, shape = '●'): string {
  return shape.repeat(n);
}

function q(prompt: string, answer?: string): WorksheetQuestion {
  return answer ? { prompt, answer } : { prompt };
}

// --------------------------------------------------------------------------
// Worksheet shapes -- one function per lesson type, matching worksheets.py's task lists
// --------------------------------------------------------------------------
function phonics(rng: SeededRandom, focus: string): WorksheetQuestion[] {
  const words = phonicsWords(rng, focus);
  let graphemes = [...focus.matchAll(/\b([a-z]{1,3})\b/g)]
    .map((m) => m[1])
    .filter((g) => !['the', 'and', 'a', 'to', 'in', 'of', 'set', 'our', 'own'].includes(g))
    .slice(0, 3);
  if (graphemes.length === 0) graphemes = [...new Set(words.map((w) => w[0]))].slice(0, 3);

  const out: WorksheetQuestion[] = graphemes.map((g) => q(`Trace and write the letters "${g}" three times.`));
  out.push(q(`Read each word aloud to your partner, ticking off the ones you can read on your own: ${words.join(', ')}.`));
  for (const w of words.slice(0, 4)) {
    out.push(q(`Say the word "${w}" slowly. Write one sound in each of the ${w.length} boxes.`, w));
  }
  out.push(q(`Write a sentence using one of today's words (${words.slice(0, 3).join(', ')}).`));
  return out;
}

function handwriting(): WorksheetQuestion[] {
  return [
    q('Warm up: trace the wavy pattern without lifting your pencil.'),
    q('Trace today\'s letters, starting at the dot and following the arrow.'),
    q('Now write the letters on your own, four times.'),
    q('Write your name three times, as neatly as you can.'),
  ];
}

function reading(): WorksheetQuestion[] {
  return [
    q('Look at the cover. What do you think this book is about? Draw it.'),
    q('Write the title and author of your book.'),
    q('Draw your favourite part of the book.'),
    q("Finish the sentences: 'My favourite part was...' and 'I liked it because...'."),
  ];
}

function writing(): WorksheetQuestion[] {
  return [
    q('Draw what happens in your story: one picture for the beginning, one for the middle, one for the end.'),
    q('Now write your sentences. Remember a capital letter and a full stop.'),
    q(
      'Check your work. Tick each one: capital letter at the start, full stop at the end, finger spaces between words, it makes sense when read aloud.'
    ),
  ];
}

function poetry(): WorksheetQuestion[] {
  const rhymeSeeds = ['cat', 'pin', 'hop', 'bed'];
  return [
    ...rhymeSeeds.map((w) => q(`Write two words that rhyme with "${w}".`)),
    q('Read the rhyme aloud. Clap once for every beat.'),
    q('Write two lines of your own that rhyme.'),
    q('Draw a picture for your rhyme.'),
  ];
}

function counting(rng: SeededRandom, _focus: string, title: string): WorksheetQuestion[] {
  const hi = numberRange(title);
  const out: WorksheetQuestion[] = [];
  for (let i = 0; i < 4; i++) {
    const n = rng.randint(1, hi);
    out.push(q(`Count the objects and write how many: ${dotsStr(n)}`, String(n)));
  }
  for (let i = 0; i < 4; i++) {
    const n = rng.randint(2, hi);
    out.push(q(`Draw ${n} circles in the box.`));
  }
  const trackLen = Math.min(hi, 12);
  const track = Array.from({ length: trackLen }, (_, i) => (i === 2 || i === 5 || i === 7 ? '__' : String(i + 1)));
  out.push(q(`Fill in the missing numbers: ${track.join(', ')}`, Array.from({ length: trackLen }, (_, i) => i + 1).join(', ')));
  for (let i = 0; i < 3; i++) {
    const start = rng.randint(1, Math.max(2, hi - 3));
    out.push(q(`Start at ${start} and count on. Write the next three numbers.`, `${start + 1}, ${start + 2}, ${start + 3}`));
  }
  return out;
}

function calculating(rng: SeededRandom, focus: string, title: string): WorksheetQuestion[] {
  const isSubtract = /subtract|take away|difference|counting back/.test(focus);
  const op = isSubtract ? '−' : '+';
  const hi = numberRange(title);
  const out: WorksheetQuestion[] = [];
  for (let i = 0; i < 6; i++) {
    if (isSubtract) {
      const a = rng.randint(1, hi);
      const b = rng.randint(0, a);
      out.push(q(`${a} ${op} ${b} =`, String(a - b)));
    } else {
      const a = rng.randint(0, hi);
      const b = rng.randint(0, Math.max(0, hi - a));
      out.push(q(`${a} ${op} ${b} =`, String(a + b)));
    }
  }
  for (let i = 0; i < 2; i++) {
    const a = rng.randint(1, Math.max(2, Math.floor(hi / 2)));
    const b = rng.randint(1, Math.max(2, Math.floor(hi / 3)));
    const answer = isSubtract ? Math.max(0, a - b) : a + b;
    out.push(q(`Draw objects to help you solve: ${a} ${op} ${b} =`, String(answer)));
  }
  for (let i = 0; i < 3; i++) {
    const a = rng.randint(1, Math.max(2, Math.floor(hi / 2)));
    const total = rng.randint(Math.max(3, Math.floor(hi / 2) + 1), hi);
    const missing = isSubtract ? Math.max(0, a - total) : Math.max(0, total - a);
    out.push(q(`What number is missing? ${a} ${op} ___ = ${total}`, String(missing)));
  }
  out.push(q("Ask your teacher to read today's word problem aloud. Draw it, then write the answer."));
  return out;
}

function shapes(): WorksheetQuestion[] {
  return [
    q('Write the name under each shape: circle, square, triangle, rectangle.'),
    q('For each shape (circle, square, triangle, rectangle), write how many sides and how many corners it has.'),
    q('Sort the shapes into two groups: straight sides only, and has a curved side.'),
    q('Make a picture using only shapes.'),
  ];
}

function measuring(): WorksheetQuestion[] {
  return [
    q('Look at the two objects. Circle the one that is longer.'),
    q('Measure three objects using cubes. Write how many cubes long each one is.'),
    q('Write the three objects in order, shortest first.'),
    q('Draw something longer than your hand, and something shorter than your hand.'),
  ];
}

function timews(): WorksheetQuestion[] {
  return [
    q('Write the missing days of the week: Monday, ___, Wednesday, ___, Friday, ___, Sunday.', 'Tuesday, Thursday, Saturday'),
    q('Draw what you do in the morning and what you do in the evening.'),
    q("Draw the hands on three clocks to show three different o'clock times."),
    q("Finish the sentences: 'Before school I...' and 'After school I...'."),
  ];
}

function datachance(): WorksheetQuestion[] {
  return [
    q('Write the question the class asked.'),
    q('Make a tally as you ask each person, then write the total for each answer.'),
    q('Colour one square in the chart for each answer you collected.'),
    q("Finish the sentences: 'Most people said...' and 'The fewest people said...'."),
  ];
}

function fractions(): WorksheetQuestion[] {
  const out: WorksheetQuestion[] = [
    q('Look at the four shapes. Tick the ones split into two equal (fair) parts.'),
    q('Colour exactly half of each shape (a square, a circle, a rectangle).'),
  ];
  for (const n of [4, 6, 8, 10]) {
    out.push(q(`Half of ${n} objects is how many? Draw them shared equally between two.`, String(n / 2)));
  }
  out.push(q('Draw sweets shared fairly between two children.'));
  return out;
}

function observe(): WorksheetQuestion[] {
  return [
    q('Look closely with a hand lens. Draw what you see.'),
    q('Write the names of the parts on your drawing.'),
    q('Draw a line matching each part to what it does.'),
    q("Finish the sentence: 'I noticed that...'."),
  ];
}

function sorting(): WorksheetQuestion[] {
  return [
    q("Sort each thing into 'Yes' or 'No'."),
    q("Write the rule you used: 'I sorted them by...'."),
    q('Now sort them again, a different way.'),
    q('Circle the odd one out and say why.'),
  ];
}

function enquiry(): WorksheetQuestion[] {
  return [
    q('Write the question we are answering.'),
    q("Write your prediction: 'I think...' Why do you think that?"),
    q('Draw the test we did.'),
    q('Record what happened.'),
    q('Was your prediction right? Write what you found out.'),
  ];
}

function artws(): WorksheetQuestion[] {
  return [
    q('Fill the box with the marks you are practising.'),
    q('Sketch what you can see.'),
    q('Colour the swatches you mixed and write their names.'),
    q('What will you make next? Draw and write your idea.'),
  ];
}

function gpws(): WorksheetQuestion[] {
  return [
    q('Write or draw one thing you already know about this.'),
    q('Write a question you want to ask.'),
    q('Record what you found out.'),
    q("Finish the sentences: 'I think...' 'because...'."),
  ];
}

function computingws(): WorksheetQuestion[] {
  return [
    q('Number the steps in order: 1, 2, 3, 4.'),
    q("Write or draw your instructions in order: 'First...', 'Next...', 'Then...', 'Last...'."),
    q("Did it work? Tick one: 'It worked' or 'It did not work'."),
    q('What would you change?'),
  ];
}

function safetyws(): WorksheetQuestion[] {
  return [
    q(
      'Tick the safe choices: telling a grown-up if something worries me; sharing my password with a friend; being kind in a message; keeping my name and address private.'
    ),
    q('Draw two people you could ask for help: one at school, one at home.'),
    q('Write one rule for our class.'),
  ];
}

function review(): WorksheetQuestion[] {
  return [
    q("Tick what you can do on your own: 'I can do this on my own', 'I can do this with a little help', 'I want to practise this again'."),
    q('Show what you know: have a go at these questions.'),
    q('Draw one thing you learned in this unit.'),
    q('What do you want to get better at next time?'),
  ];
}

type WorksheetFn = (rng: SeededRandom, focus: string, title: string) => WorksheetQuestion[];

const RULES: Record<string, [RegExp, WorksheetFn][]> = {
  english: [
    [/^phonics|analogy|word famil|consonant cluster|long vowel|phoneme|sound patterns|rhyming string/, phonics],
    [/^handwriting|pencil|letter formation|joining/, handwriting],
    [/^guided reading|shared reading|handling a book|parts of a book|cover|predict|favourite book|reading response|talking about|who is in/, reading],
    [/rhym|poem|recit|chant|beat|refrain|couplet/, poetry],
    [/writ|plan|recount|report|instruction|label|sign|edit|check/, writing],
    [/retell|story|role play|puppet|acting|character/, reading],
  ],
  mathematics: [
    [/count|numeral|number|zero|order|compar|more, fewer|teen|estimat|correspond|pattern|tens and ones/, counting],
    [/add|subtract|double|halv|number pairs|fact famil|missing|combin|taking away|difference|total|bridging/, calculating],
    [/shape|sides|corner|faces|edges|circle|triangle|square|rectangle|cube|sphere|cylinder|cone|position|direction|turn/, shapes],
    [/length|mass|capacity|measur|heav|full|empty|long|short|tall/, measuring],
    [/time|clock|days of the week|months|yesterday|before, after/, timews],
    [/data|graph|pictogram|venn|carroll|sort|chance|table|question/, datachance],
    [/fraction|half|equal parts|shar/, fractions],
  ],
  science: [
    [/plan.*test|which |does |investigat|enquir|record|result|what our|observ/, enquiry],
    [/sort|group|compar|material|senses/, sorting],
    [/parts of|looking closely|what each part|body|animals|plants|grow|sky|weather|sound|push|pull|move/, observe],
  ],
  'global-perspectives': [[/./, gpws]],
  'art-design': [[/./, artws]],
  computing: [
    [/safe|online|private|kind|screen|internet/, safetyws],
    [/./, computingws],
  ],
};

const FALLBACK: Record<string, WorksheetFn> = {
  english: writing,
  mathematics: counting,
  science: observe,
  'art-design': artws,
  'global-perspectives': gpws,
  computing: computingws,
};

/** Returns a full WorksheetContent for one lesson -- direct port of worksheet_for(). Review and
 * assessment-phase lessons always get the review shape, matching the spec. */
export function worksheetFor(lessonNumber: number, title: string, phase: string, subjectSlug: string): WorksheetContent {
  const rng = new SeededRandom(`${subjectSlug}-${lessonNumber}`);
  const low = title.toLowerCase();
  const focus = title.includes(':') ? title.split(':').slice(1).join(':').trim().toLowerCase() : low;

  let fn: WorksheetFn;
  if (phase === 'review' || phase === 'assessment') {
    fn = review;
  } else {
    const rules = RULES[subjectSlug] ?? [];
    const match = rules.find(([pattern]) => pattern.test(low));
    fn = match ? match[1] : FALLBACK[subjectSlug] ?? writing;
  }

  return {
    title: `Worksheet -- ${title}`,
    instructions: 'Primary 1 · Selong Bay School',
    questions: fn(rng, focus, low),
  };
}
