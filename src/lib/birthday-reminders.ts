import { sql } from '@/lib/db';

/** How many days before a child's dob (month/day, recurring every year) the cron notifies their
 * teachers — see src/app/api/cron/birthday-reminders/route.ts. */
export const BIRTHDAY_REMINDER_DAYS_BEFORE = 3;

export interface ChildDueForBirthdayReminder {
  id: number;
  child_full_name: string;
  class_name: string | null;
  turning_age: number;
  birthday_year: number;
  /** e.g. "22 September" — the upcoming birthday's day/month, formatted server-side so the email
   * never needs to re-derive it (and never shows the birth year, since it's a recurring date). */
  birthday_date_label: string;
}

/** Matches on month/day only (dob's year is the birth year, not this year) via to_char, so this
 * is a real "is CURRENT_DATE + daysBefore this child's birthday" check, not a literal date
 * equality. One known gap: a child born on 29 February won't match in a non-leap year, since that
 * date doesn't exist to compare against -- accepted rather than special-cased, since it only
 * affects one specific birth date in 3 years out of 4.
 *
 * The LEFT JOIN ... IS NULL against birthday_reminders (keyed on (child_id, birthday_year), not
 * just child_id, since this recurs annually) means the cron never even attempts a duplicate send
 * for a birthday already reminded about this year, same pattern as getChildrenDueForWelcomeLetter. */
export async function getChildrenDueForBirthdayReminder(daysBefore: number): Promise<ChildDueForBirthdayReminder[]> {
  return (await sql`
    SELECT c.id, c.child_full_name, c.class_name,
      (EXTRACT(YEAR FROM CURRENT_DATE + ${daysBefore}::int)::int - EXTRACT(YEAR FROM c.dob)::int) AS turning_age,
      EXTRACT(YEAR FROM CURRENT_DATE + ${daysBefore}::int)::int AS birthday_year,
      TRIM(to_char(CURRENT_DATE + ${daysBefore}::int, 'DD Month')) AS birthday_date_label
    FROM children c
    LEFT JOIN birthday_reminders br
      ON br.child_id = c.id
      AND br.birthday_year = EXTRACT(YEAR FROM CURRENT_DATE + ${daysBefore}::int)::int
    WHERE c.is_active = true
      AND c.dob IS NOT NULL
      AND to_char(c.dob, 'MM-DD') = to_char(CURRENT_DATE + ${daysBefore}::int, 'MM-DD')
      AND br.id IS NULL
  `) as unknown as ChildDueForBirthdayReminder[];
}

/** birthday_year makes this safe to call more than once for the same upcoming birthday --
 * ON CONFLICT DO NOTHING rather than erroring, since the query above already excludes rows with
 * an existing reminder, so a conflict here would only happen from a genuine race, not a bug. */
export async function recordBirthdayReminderSent(childId: number, birthdayYear: number): Promise<void> {
  await sql`
    INSERT INTO birthday_reminders (child_id, birthday_year)
    VALUES (${childId}, ${birthdayYear})
    ON CONFLICT (child_id, birthday_year) DO NOTHING
  `;
}
