import { sql } from '@/lib/db';
import { isHoliday } from '@/lib/academic-calendar';
import type { DayOfWeek } from '@/lib/class-schedule';
import type { ClassCurriculumImportInput, ClassCurriculumLessonPhase, WeekdayAbbr } from '@/lib/validation';

/** Port of DASHBOARDSPEC.md's teaching_days() + split_proportionally() + pad_unit() +
 * build_strand_lessons() + build_lessons() (build.py), with one deliberate change: instead of a
 * hardcoded CALENDAR object, every date comes from this app's real academic_terms +
 * academic_calendar_exceptions tables, and every weekday a strand claims is checked against real
 * class_schedule rows for the (className, subject) pair -- so pacing reflects the actual
 * timetable, not an assumption baked into an input file. The hard-fail behaviour (a unit's
 * authored lessons not fitting its allotted slots -> throw, never silently truncate) is preserved
 * exactly, and extended to two more cases the original script couldn't hit against a hardcoded
 * calendar: a strand claiming a weekday with no real class_schedule period, and a 'by-term' unit
 * whose declared term doesn't match any real academic_terms.label. */

const WEEKDAY_ABBR_TO_DOW: Record<WeekdayAbbr, DayOfWeek> = {
  Mon: 'monday',
  Tue: 'tuesday',
  Wed: 'wednesday',
  Thu: 'thursday',
  Fri: 'friday',
  Sat: 'saturday',
  Sun: 'sunday',
};

const WEEKDAY_NAME: Record<DayOfWeek, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

const DOW_BY_JS_INDEX: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

interface AcademicTermRow {
  label: string;
  start_date: string;
  end_date: string;
}
interface ExceptionRow {
  start_date: string;
  end_date: string;
}
interface TeachingDayRow {
  date: string;
  dayOfWeek: DayOfWeek;
  termLabel: string;
}

/** Every real calendar day across every configured academic_terms row, minus every
 * academic_calendar_exceptions row -- unlike the spec's ALL_DAYS, not restricted to Mon-Fri;
 * whether a weekday is actually taught is decided later, against real class_schedule rows. */
async function realTeachingDays(): Promise<TeachingDayRow[]> {
  const terms = (await sql`
    SELECT label, start_date::text, end_date::text FROM academic_terms ORDER BY start_date
  `) as unknown as AcademicTermRow[];
  if (terms.length === 0) {
    throw new Error('No academic_terms are configured yet -- set up the Academic Calendar (terms and dates) before importing a class curriculum.');
  }

  const exceptions = (await sql`
    SELECT start_date::text, end_date::text FROM academic_calendar_exceptions
  `) as unknown as ExceptionRow[];

  const out: TeachingDayRow[] = [];
  for (const term of terms) {
    const cur = new Date(`${term.start_date}T00:00:00Z`);
    const end = new Date(`${term.end_date}T00:00:00Z`);
    while (cur.getTime() <= end.getTime()) {
      const dateStr = cur.toISOString().slice(0, 10);
      if (!isHoliday(dateStr, exceptions)) {
        out.push({ date: dateStr, dayOfWeek: DOW_BY_JS_INDEX[cur.getUTCDay()], termLabel: term.label });
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }
  return out;
}

/** The real weekdays this class actually has a period for this subject, from class_schedule --
 * the source of truth a strand's `days` gets checked against. */
async function realScheduledDays(className: string, subject: string): Promise<Set<DayOfWeek>> {
  const rows = (await sql`
    SELECT DISTINCT day_of_week FROM class_schedule WHERE class_name = ${className} AND subject = ${subject}
  `) as unknown as { day_of_week: DayOfWeek }[];
  return new Set(rows.map((r) => r.day_of_week));
}

/** Hands out `total` slots across `weights`, losing none to rounding -- direct port of
 * split_proportionally(), including its "give the leftovers to whoever lost the most to
 * truncation" tie-break. */
export function splitProportionally(total: number, weights: number[]): number[] {
  if (weights.length === 0) return [];
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (total * w) / totalWeight);
  const out = raw.map((x) => Math.floor(x));
  const left = total - out.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, remainder: r - out[i] }))
    .sort((a, b) => b.remainder - a.remainder)
    .map((x) => x.i);
  for (let i = 0; i < left; i++) {
    out[order[i % order.length]] += 1;
  }
  return out;
}

export interface CoreLesson {
  title: string;
  refs: string[];
  codes: string[];
  phase: ClassCurriculumLessonPhase;
  notes: string;
}

interface UnitForPadding {
  title: string;
  short: string;
  refs?: string[];
  practice?: string[];
  lessons: { title: string; refs?: string[]; codes?: string[]; phase?: ClassCurriculumLessonPhase; notes?: string }[];
}

/** Direct port of pad_unit(): fits a unit's authored lessons to exactly `n` teaching slots.
 * Fewer slots than lessons throws -- deliberately, never silently truncated -- because that
 * drops the end of the unit, which is where the review and check lessons live. More slots than
 * lessons interleaves practice lessons and closes with a review and an end-of-unit check. */
export function padUnit(unit: UnitForPadding, n: number): CoreLesson[] {
  const core: CoreLesson[] = unit.lessons.map((l) => ({
    title: l.title,
    refs: l.refs ?? unit.refs ?? [],
    codes: l.codes ?? l.refs ?? unit.refs ?? [],
    phase: l.phase ?? 'content',
    notes: l.notes ?? '',
  }));

  if (n < core.length) {
    throw new Error(
      `Unit "${unit.title}" has ${core.length} authored lessons but only ${n} teaching slots available. ` +
        `Lower its weight, cut a lesson, or accept that the unit needs more time.`
    );
  }
  if (n === core.length) return core;

  let extra = n - core.length;
  const unitRefs = unit.refs ?? [];
  const tail: CoreLesson[] = [];
  if (extra >= 1) {
    tail.push({ title: `Review and consolidate: ${unit.short}`, phase: 'review', refs: unitRefs, codes: unitRefs, notes: '' });
    extra -= 1;
  }
  if (extra >= 1) {
    tail.push({ title: `End-of-unit check: ${unit.short}`, phase: 'assessment', refs: unitRefs, codes: unitRefs, notes: '' });
    extra -= 1;
  }

  const practice =
    unit.practice && unit.practice.length > 0
      ? unit.practice
      : [`Practise and apply: ${unit.short}`, `Problem solving: ${unit.short}`, `Reasoning and explaining: ${unit.short}`, `Fluency practice: ${unit.short}`];
  const inserts: CoreLesson[] = [];
  for (let i = 0; i < extra; i++) {
    let title = practice[i % practice.length];
    const roundNo = Math.floor(i / practice.length);
    if (roundNo) title = `${title} (${roundNo + 1})`;
    inserts.push({ title, phase: 'practice', refs: unitRefs, codes: unitRefs, notes: '' });
  }

  const out: CoreLesson[] = [];
  const ins = [...inserts];
  if (ins.length > 0) {
    const every = Math.max(1, Math.round(core.length / (ins.length + 1)));
    core.forEach((l, idx) => {
      out.push(l);
      if (ins.length > 0 && (idx + 1) % every === 0) out.push(ins.shift() as CoreLesson);
    });
    out.push(...ins);
  } else {
    out.push(...core);
  }
  return [...out, ...tail];
}

export interface ScheduledLesson extends CoreLesson {
  lessonNumber: number;
  date: string;
  weekday: string;
  termLabel: string;
  strand: string;
  unit: string;
  unitShort: string;
}

/** One strand's units (or fixed sequence) assigned onto its real weekday slots. Throws (never
 * silently drops a day) if the strand claims a weekday with no matching class_schedule period. */
function buildStrandLessons(
  strand: ClassCurriculumImportInput['strands'][number],
  strandUnits: ClassCurriculumImportInput['units'],
  allocation: ClassCurriculumImportInput['allocation'],
  allDays: TeachingDayRow[],
  scheduledDays: Set<DayOfWeek>
): Omit<ScheduledLesson, 'lessonNumber' | 'weekday'>[] {
  for (const abbr of strand.days) {
    if (!scheduledDays.has(WEEKDAY_ABBR_TO_DOW[abbr])) {
      throw new Error(
        `Strand "${strand.title}" claims ${abbr}, but class_schedule has no period on ${abbr} for this class/subject. ` +
          `Add it in the admin Weekly Schedule screen, or remove ${abbr} from this strand.`
      );
    }
  }
  const strandDows = new Set(strand.days.map((d) => WEEKDAY_ABBR_TO_DOW[d]));
  const days = allDays.filter((d) => strandDows.has(d.dayOfWeek));

  if (strand.kind === 'sequence') {
    const seq = strand.sequence ?? [];
    if (seq.length === 0) return [];
    return days.map((d, i) => {
      const item = seq[i % seq.length];
      return {
        date: d.date,
        termLabel: d.termLabel,
        strand: strand.title,
        unit: strand.title,
        unitShort: '',
        title: item.title,
        phase: item.phase ?? 'content',
        refs: item.refs ?? strand.refs ?? [],
        codes: item.codes ?? item.refs ?? strand.refs ?? [],
        notes: item.notes ?? '',
      };
    });
  }

  const out: Omit<ScheduledLesson, 'lessonNumber' | 'weekday'>[] = [];
  const usedUnitTitles = new Set<string>();

  function scheduleGroup(units: ClassCurriculumImportInput['units'], groupDays: TeachingDayRow[]): void {
    const counts = splitProportionally(groupDays.length, units.map((u) => u.weight));
    let cursor = 0;
    units.forEach((unit, ui) => {
      usedUnitTitles.add(unit.title);
      const core = padUnit(unit, counts[ui]);
      for (const lesson of core) {
        const d = groupDays[cursor++];
        out.push({ date: d.date, termLabel: d.termLabel, strand: strand.title, unit: unit.title, unitShort: unit.short, ...lesson });
      }
    });
  }

  if (allocation === 'continuous') {
    scheduleGroup(strandUnits, days);
  } else {
    // 'by-term': every real term that has at least one teaching day for this strand gets its own
    // slot pool, and only the units declared for that term draw from it.
    const termLabelsInOrder = [...new Set(days.map((d) => d.termLabel))];
    for (const termLabel of termLabelsInOrder) {
      const termDays = days.filter((d) => d.termLabel === termLabel);
      const termUnits = strandUnits.filter((u) => u.term === termLabel);
      scheduleGroup(termUnits, termDays);
    }
    const missed = strandUnits.filter((u) => !usedUnitTitles.has(u.title));
    if (missed.length > 0) {
      const realTerms = termLabelsInOrder.join(', ') || '(none)';
      throw new Error(
        `Unit(s) ${missed.map((u) => `"${u.title}" (term: "${u.term}")`).join(', ')} declare a "term" that doesn't match any real ` +
          `academic term this strand has teaching days in (real terms found: ${realTerms}). Fix the unit's "term" field to match an ` +
          `actual academic_terms label exactly.`
      );
    }
  }

  return out;
}

/** Schedules every strand of one class-curriculum file against the real calendar and timetable,
 * merges them chronologically (same-date ties broken by strand order, matching build_lessons()),
 * and numbers the result 1..N. Throws on any unfit unit, unscheduled weekday, or unmatched
 * 'by-term' unit -- see buildStrandLessons and padUnit. */
export async function scheduleClassCurriculum(input: ClassCurriculumImportInput, className: string): Promise<ScheduledLesson[]> {
  const [allDays, scheduledDays] = await Promise.all([realTeachingDays(), realScheduledDays(className, input.short)]);
  if (scheduledDays.size === 0) {
    throw new Error(
      `No class_schedule periods found for "${className}" / "${input.short}". Add this class's Weekly Schedule (day/time slots for this subject) before importing its curriculum.`
    );
  }

  const raw: Omit<ScheduledLesson, 'lessonNumber' | 'weekday'>[] = [];
  for (const strand of input.strands) {
    const strandUnits = input.units.filter((u) => u.strand === strand.title);
    raw.push(...buildStrandLessons(strand, strandUnits, input.allocation, allDays, scheduledDays));
  }

  const strandIndex = new Map(input.strands.map((s, i) => [s.title, i]));
  raw.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return (strandIndex.get(a.strand) ?? 0) - (strandIndex.get(b.strand) ?? 0);
  });

  const dowByDate = new Map(allDays.map((d) => [d.date, d.dayOfWeek]));
  return raw.map((l, i) => ({
    ...l,
    lessonNumber: i + 1,
    weekday: WEEKDAY_NAME[dowByDate.get(l.date) ?? 'monday'],
  }));
}
