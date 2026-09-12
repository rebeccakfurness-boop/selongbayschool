import { sql } from './db';

/** Shared by scripts/split-terms-into-four.ts (terminal, dry-run/--apply) and the admin "Split
 * into 4 terms" panel on Curriculum Plans (browser button, since this session's own environment
 * has no database credentials to run the script directly) -- one place for the split logic so the
 * two never drift.
 *
 * Only class/subjects with exactly 3 terms and at least 4 units are touched -- everything else is
 * left alone and flagged for review. Units always move whole between terms (never split mid-unit),
 * and unit/lesson ids never change, so progress, submissions, translations, and occurrence links
 * all survive untouched.
 *
 * Two ways to choose where the 3 cuts (for 4 buckets) fall:
 *  - 'calendar_dates' (preferred): every unit in the group has real, fully-dated lessons (from a
 *    real scheme of work -- see curriculum_unit_lessons.lesson_date), so the cut points are simply
 *    the 3 biggest gaps in the calendar between one unit's lessons and the next's -- i.e. the
 *    school's own real holiday breaks (mid-term break, end of term, etc.), not an arbitrary
 *    fraction. This is "in line with the academic calendar" by construction: it's derived from the
 *    actual dates lessons were scheduled against that calendar, without needing to hardcode any
 *    specific date or re-read the calendar itself.
 *  - 'lesson_count' (fallback): used only when a group's units don't have full date coverage (e.g.
 *    AI-generated or hand-authored content with no real per-lesson dates) -- balances by lesson
 *    count at the ~25/50/75% marks instead, same as before.
 */

interface TermRow {
  id: number;
  class_name: string;
  subject: string;
  term_label: string;
  framework_label: string | null;
  exam_board: string | null;
  exam_series: string | null;
  syllabus_pdf_url: string | null;
  workbook_pdf_url: string | null;
  source_verified: boolean | null;
  source_note: string | null;
  ongoing_card: unknown;
}
interface UnitRow {
  id: number;
  term_id: number;
  sort_order: number;
  title: string;
}
interface UnitLessonStats {
  lessonCount: number;
  datedCount: number;
  minDate: string | null;
  maxDate: string | null;
}
interface Bucket {
  units: UnitRow[];
  lessonCount: number;
}

export interface TermSplitGroupPlan {
  className: string;
  subject: string;
  status: 'planned' | 'skipped';
  reason?: string;
  oldTermLabels: string[];
  splitMethod?: 'calendar_dates' | 'lesson_count';
  buckets?: { unitTitles: string[]; lessonCount: number; dateRange: string | null }[];
  /** Only present internally (never serialized to the client) -- kept on the plan object so apply
   * can act on exactly what was previewed without re-querying and risking drift. */
  _internal?: { ordered: TermRow[]; buckets: Bucket[] };
}

export interface TermSplitPlan {
  groups: TermSplitGroupPlan[];
  plannedCount: number;
  skippedCount: number;
}

function termLabelNumber(label: string, fallback: number): number {
  const m = label.match(/\d+/);
  return m ? Number(m[0]) : fallback;
}

function bucketDateRange(units: UnitRow[], statsByUnit: Map<number, UnitLessonStats>): string | null {
  const dates = units
    .flatMap((u) => {
      const s = statsByUnit.get(u.id);
      return s ? [s.minDate, s.maxDate] : [];
    })
    .filter((d): d is string => d != null)
    .sort();
  if (dates.length === 0) return null;
  return `${dates[0]} to ${dates[dates.length - 1]}`;
}

/** Divides the group's actual calendar span (earliest lesson date to latest, across all its
 * units) into 4 equal-length time quarters, then assigns each unit (in chronological order) to
 * whichever quarter its own midpoint date falls into -- a direct, literal reading of "in line with
 * the academic calendar": each new term covers a real, roughly-equal quarter of the year the
 * content actually ran across, not a guess at where a break happens to sit.
 *
 * Deliberately NOT "cut at the biggest gap between units" -- tried that first, but a real holiday
 * break usually falls *inside* a unit's date range (a scheme of work carries a unit's lessons
 * across it rather than ending the unit right before the break), not neatly between two units, so
 * hunting for the largest inter-unit gap can land on an arbitrary weekend-sized gap instead of the
 * real multi-week break. Quartering the actual date span sidesteps that entirely.
 *
 * Returns null if any unit is missing full date coverage (caller falls back to
 * splitByLessonCount instead). */
function splitByCalendarDates(units: UnitRow[], statsByUnit: Map<number, UnitLessonStats>): Bucket[] | null {
  for (const u of units) {
    const s = statsByUnit.get(u.id);
    if (!s || s.lessonCount === 0 || s.datedCount < s.lessonCount || !s.minDate || !s.maxDate) return null;
  }

  const spanStart = Math.min(...units.map((u) => new Date(statsByUnit.get(u.id)!.minDate!).getTime()));
  const spanEnd = Math.max(...units.map((u) => new Date(statsByUnit.get(u.id)!.maxDate!).getTime()));
  const span = spanEnd - spanStart;
  if (span <= 0) return null;

  const bucketed: UnitRow[][] = [[], [], [], []];
  let lastBucket = 0;
  for (const u of units) {
    const s = statsByUnit.get(u.id)!;
    const midpoint = (new Date(s.minDate!).getTime() + new Date(s.maxDate!).getTime()) / 2;
    const quarter = Math.min(3, Math.floor(((midpoint - spanStart) / span) * 4));
    // Monotonic: a unit is chronologically ordered relative to the ones before it, so its bucket
    // can only ever stay the same or move forward, never back -- preserves "cut only between
    // units" even if a unit's own midpoint math lands it a step behind the previous unit's.
    lastBucket = Math.max(lastBucket, quarter);
    bucketed[lastBucket].push(u);
  }

  return bucketed.map((bucketUnits) => ({
    units: bucketUnits,
    lessonCount: bucketUnits.reduce((s, u) => s + (statsByUnit.get(u.id)?.lessonCount ?? 0), 0),
  }));
}

/** Splits an ordered unit list into 4 buckets, cutting only between units, at whichever unit
 * boundary lands closest to each 25/50/75% cumulative-lesson-count target -- clamped so every
 * later bucket still gets at least one unit if there are enough units to go around. */
function splitByLessonCount(units: UnitRow[], statsByUnit: Map<number, UnitLessonStats>): Bucket[] {
  const cum: number[] = [];
  let running = 0;
  for (const u of units) {
    running += statsByUnit.get(u.id)?.lessonCount ?? 0;
    cum.push(running);
  }
  const total = running;
  const targets = [0.25, 0.5, 0.75].map((f) => f * total);

  const cutAfterIndex: number[] = [];
  for (const target of targets) {
    let idx = cum.findIndex((c) => c >= target);
    if (idx === -1) idx = units.length - 1;
    const minIdx = cutAfterIndex.length > 0 ? cutAfterIndex[cutAfterIndex.length - 1] + 1 : 0;
    const remainingBucketsAfterThis = 3 - cutAfterIndex.length;
    const maxIdx = units.length - 1 - remainingBucketsAfterThis;
    idx = Math.min(Math.max(idx, minIdx), Math.max(maxIdx, minIdx));
    cutAfterIndex.push(idx);
  }

  return bucketsFromCuts(units, cutAfterIndex, statsByUnit);
}

function bucketsFromCuts(units: UnitRow[], cutAfterIndex: number[], statsByUnit: Map<number, UnitLessonStats>): Bucket[] {
  const boundaries = [-1, ...cutAfterIndex, units.length - 1];
  const buckets: Bucket[] = [];
  for (let i = 0; i < 4; i++) {
    const slice = units.slice(boundaries[i] + 1, boundaries[i + 1] + 1);
    buckets.push({ units: slice, lessonCount: slice.reduce((s, u) => s + (statsByUnit.get(u.id)?.lessonCount ?? 0), 0) });
  }
  return buckets;
}

/** Read-only -- computes exactly what would change, for every class/subject, without writing
 * anything. Safe to call as often as needed for a preview. */
export async function computeTermSplitPlan(): Promise<TermSplitPlan> {
  const terms = (await sql`
    SELECT id, class_name, subject, term_label, framework_label, exam_board, exam_series,
      syllabus_pdf_url, workbook_pdf_url, source_verified, source_note, ongoing_card
    FROM curriculum_terms
    ORDER BY class_name, subject, term_label
  `) as unknown as TermRow[];

  const units = (await sql`
    SELECT id, term_id, sort_order, title FROM curriculum_term_units ORDER BY term_id, sort_order, id
  `) as unknown as UnitRow[];
  const unitsByTerm = new Map<number, UnitRow[]>();
  for (const u of units) {
    (unitsByTerm.get(u.term_id) ?? unitsByTerm.set(u.term_id, []).get(u.term_id)!).push(u);
  }

  const lessonStats = (await sql`
    SELECT unit_id, count(*)::int AS lesson_count, count(lesson_date)::int AS dated_count,
      min(lesson_date)::text AS min_date, max(lesson_date)::text AS max_date
    FROM curriculum_unit_lessons GROUP BY unit_id
  `) as unknown as { unit_id: number; lesson_count: number; dated_count: number; min_date: string | null; max_date: string | null }[];
  const statsByUnit = new Map<number, UnitLessonStats>(
    lessonStats.map((r) => [r.unit_id, { lessonCount: r.lesson_count, datedCount: r.dated_count, minDate: r.min_date, maxDate: r.max_date }])
  );

  const byGroup = new Map<string, TermRow[]>();
  for (const t of terms) {
    const key = `${t.class_name}::${t.subject}`;
    (byGroup.get(key) ?? byGroup.set(key, []).get(key)!).push(t);
  }

  const groups: TermSplitGroupPlan[] = [];
  for (const [, groupTerms] of byGroup) {
    const className = groupTerms[0].class_name;
    const subject = groupTerms[0].subject;
    const oldTermLabels = groupTerms.map((t) => t.term_label);

    if (groupTerms.length !== 3) {
      groups.push({ className, subject, status: 'skipped', reason: `Has ${groupTerms.length} term(s), expected exactly 3.`, oldTermLabels });
      continue;
    }

    const ordered = [...groupTerms].sort((a, b) => termLabelNumber(a.term_label, a.id) - termLabelNumber(b.term_label, b.id));
    const orderedUnits = ordered.flatMap((t) => unitsByTerm.get(t.id) ?? []);
    const totalLessons = orderedUnits.reduce((s, u) => s + (statsByUnit.get(u.id)?.lessonCount ?? 0), 0);

    if (orderedUnits.length < 4) {
      groups.push({
        className,
        subject,
        status: 'skipped',
        reason: `Only ${orderedUnits.length} unit(s) across its 3 terms -- not enough to split into 4 without breaking a unit apart.`,
        oldTermLabels,
      });
      continue;
    }
    if (totalLessons === 0) {
      groups.push({ className, subject, status: 'skipped', reason: 'No lessons found under its units.', oldTermLabels });
      continue;
    }

    const dateBuckets = splitByCalendarDates(orderedUnits, statsByUnit);
    const splitMethod = dateBuckets ? 'calendar_dates' : 'lesson_count';
    const buckets = dateBuckets ?? splitByLessonCount(orderedUnits, statsByUnit);

    groups.push({
      className,
      subject,
      status: 'planned',
      oldTermLabels,
      splitMethod,
      buckets: buckets.map((b) => ({ unitTitles: b.units.map((u) => u.title), lessonCount: b.lessonCount, dateRange: bucketDateRange(b.units, statsByUnit) })),
      _internal: { ordered, buckets },
    });
  }

  groups.sort((a, b) => a.className.localeCompare(b.className) || a.subject.localeCompare(b.subject));
  return {
    groups,
    plannedCount: groups.filter((g) => g.status === 'planned').length,
    skippedCount: groups.filter((g) => g.status === 'skipped').length,
  };
}

/** Strips _internal before a plan is sent to the browser -- it's only there so applyTermSplitPlan
 * can act on exactly what was computed without a second query. */
export function serializableTermSplitPlan(plan: TermSplitPlan): TermSplitPlan {
  return { ...plan, groups: plan.groups.map(({ _internal, ...rest }) => rest) };
}

/** Performs the writes for every 'planned' group in the given plan (call computeTermSplitPlan()
 * immediately beforehand -- this trusts the plan's _internal data rather than re-deriving it, so
 * don't hold a plan across an unrelated delay). Returns which groups were actually applied. */
export async function applyTermSplitPlan(plan: TermSplitPlan): Promise<{ appliedGroups: { className: string; subject: string }[] }> {
  const appliedGroups: { className: string; subject: string }[] = [];

  for (const group of plan.groups) {
    if (group.status !== 'planned' || !group._internal) continue;
    const { ordered, buckets } = group._internal;

    // Merge programme-level metadata across the 3 old terms (first non-null wins, in term order)
    // -- these describe the class/subject's programme as a whole, not any one term, but only ever
    // got set on whichever term row happened to carry it (typically Term 1).
    const meta = {
      framework_label: ordered.map((t) => t.framework_label).find((v) => v != null) ?? null,
      exam_board: ordered.map((t) => t.exam_board).find((v) => v != null) ?? null,
      exam_series: ordered.map((t) => t.exam_series).find((v) => v != null) ?? null,
      syllabus_pdf_url: ordered.map((t) => t.syllabus_pdf_url).find((v) => v != null) ?? null,
      workbook_pdf_url: ordered.map((t) => t.workbook_pdf_url).find((v) => v != null) ?? null,
      source_verified: ordered.map((t) => t.source_verified).find((v) => v != null) ?? null,
      source_note: ordered.map((t) => t.source_note).find((v) => v != null) ?? null,
      ongoing_card: ordered.map((t) => t.ongoing_card).find((v) => v != null) ?? null,
    };
    const suffix = ordered[0].term_label.replace(/^Term\s*\d+\s*/i, '').trim();

    const newTermIds: number[] = [];
    for (let i = 0; i < 4; i++) {
      const label = suffix ? `Term ${i + 1} ${suffix}` : `Term ${i + 1}`;
      const rows = (await sql`
        INSERT INTO curriculum_terms
          (class_name, subject, term_label, framework_label, exam_board, exam_series, syllabus_pdf_url, workbook_pdf_url, source_verified, source_note, ongoing_card)
        VALUES (${group.className}, ${group.subject}, ${label}, ${meta.framework_label}, ${meta.exam_board}, ${meta.exam_series}, ${meta.syllabus_pdf_url}, ${meta.workbook_pdf_url}, ${meta.source_verified}, ${meta.source_note}, ${meta.ongoing_card})
        RETURNING id
      `) as unknown as { id: number }[];
      newTermIds.push(rows[0].id);
    }

    for (let i = 0; i < 4; i++) {
      const bucketUnits = buckets[i].units;
      for (let j = 0; j < bucketUnits.length; j++) {
        await sql`UPDATE curriculum_term_units SET term_id = ${newTermIds[i]}, sort_order = ${j + 1} WHERE id = ${bucketUnits[j].id}`;
      }
    }

    const oldIds = ordered.map((t) => t.id);
    await sql`DELETE FROM curriculum_terms WHERE id = ANY(${oldIds})`;

    appliedGroups.push({ className: group.className, subject: group.subject });
  }

  return { appliedGroups };
}
