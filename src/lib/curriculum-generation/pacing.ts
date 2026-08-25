import { sql } from '@/lib/db';
import type { DayOfWeek } from '@/lib/class-schedule';
import { datesForDayOfWeek, isHoliday } from '@/lib/academic-calendar';

const DEFAULT_LESSON_COUNT = 8;

export interface LessonPacing {
  /** How many lessons generate() should produce -- one per real class session when both a
   * class_schedule pattern and a matching academic_terms date range exist, otherwise
   * DEFAULT_LESSON_COUNT so generation isn't blocked on the timetable/calendar being set up
   * first. */
  sessionCount: number;
  source: 'class_schedule' | 'default';
  academicTermLabel: string | null;
}

interface ScheduleSlotRow {
  day_of_week: DayOfWeek;
}
interface AcademicTermRow {
  label: string;
  start_date: string;
  end_date: string;
}
interface ExceptionRow {
  start_date: string;
  end_date: string;
}

/** class_schedule's real recurring slots for this class+subject, expanded via
 * academic-calendar.ts's own date-generation logic (datesForDayOfWeek/isHoliday -- the same
 * functions regenerateScheduleOccurrences uses) across whichever academic_terms row's label
 * matches termLabel, skipping holidays -- exactly "class_schedule's real recurring slots...
 * expanded via the existing academic-calendar.ts logic" per the generation engine's spec. */
export async function computeLessonPacing(className: string, subject: string, termLabel: string): Promise<LessonPacing> {
  const slots = (await sql`
    SELECT day_of_week FROM class_schedule WHERE class_name = ${className} AND subject = ${subject}
  `) as unknown as ScheduleSlotRow[];

  if (slots.length === 0) {
    return { sessionCount: DEFAULT_LESSON_COUNT, source: 'default', academicTermLabel: null };
  }

  const [academicTerm] = (await sql`
    SELECT label, start_date::text, end_date::text FROM academic_terms WHERE label = ${termLabel}
  `) as unknown as AcademicTermRow[];

  if (!academicTerm) {
    // Real weekly slots exist, but no dated academic_terms row matches this programme's
    // term_label yet -- fall back rather than guessing at a date range that isn't configured.
    return { sessionCount: DEFAULT_LESSON_COUNT, source: 'default', academicTermLabel: null };
  }

  const exceptions = (await sql`
    SELECT start_date::text, end_date::text FROM academic_calendar_exceptions
    WHERE start_date <= ${academicTerm.end_date} AND end_date >= ${academicTerm.start_date}
  `) as unknown as ExceptionRow[];

  let sessionCount = 0;
  for (const slot of slots) {
    const dates = datesForDayOfWeek(academicTerm.start_date, academicTerm.end_date, slot.day_of_week);
    sessionCount += dates.filter((d) => !isHoliday(d, exceptions)).length;
  }

  return { sessionCount: Math.max(sessionCount, 1), source: 'class_schedule', academicTermLabel: academicTerm.label };
}
