import { sql } from '@/lib/db';

/** How many days before a child's enrolment_date (their first day) the cron sends the welcome
 * letter — see src/pages/api/cron/welcome-letters.ts. */
export const WELCOME_LETTER_DAYS_BEFORE = 3;

export type WelcomeLetterSentBy = 'auto' | 'admin';

export interface WelcomeLetterSummaryRow {
  id: number;
  sent_at: string;
  sent_by: WelcomeLetterSentBy;
}

export async function getWelcomeLetterForChild(childId: number): Promise<WelcomeLetterSummaryRow | null> {
  const rows = (await sql`
    SELECT id, sent_at::text, sent_by FROM welcome_letters WHERE child_id = ${childId}
  `) as unknown as WelcomeLetterSummaryRow[];
  return rows[0] || null;
}

/** Records a send, whether from the cron job or an admin's manual "Send now" override. child_id
 * is UNIQUE, so a manual re-send after the cron already fired (or a second manual click) just
 * updates the existing row's sent_at/sent_by rather than erroring or duplicating. */
export async function recordWelcomeLetterSent(childId: number, sentBy: WelcomeLetterSentBy): Promise<number> {
  const rows = await sql`
    INSERT INTO welcome_letters (child_id, sent_by)
    VALUES (${childId}, ${sentBy})
    ON CONFLICT (child_id) DO UPDATE SET sent_at = now(), sent_by = ${sentBy}
    RETURNING id
  `;
  return rows[0].id as number;
}

export interface ChildDueForWelcomeLetter {
  id: number;
  child_full_name: string;
  primary_contact_email: string;
  parent1_name: string | null;
  parent2_name: string | null;
  enrolment_date: string;
  class_name: string | null;
  programme: string | null;
  lunch_option: string | null;
}

/** The cron job's query: any active child whose enrolment_date (their first day) is exactly
 * `daysBefore` days from today, has an email on file to send to, and hasn't already had a welcome
 * letter sent (the LEFT JOIN ... IS NULL check, rather than relying solely on the UNIQUE
 * constraint, so the cron never even attempts an email for a child it's already covered). */
export async function getChildrenDueForWelcomeLetter(daysBefore: number): Promise<ChildDueForWelcomeLetter[]> {
  return (await sql`
    SELECT c.id, c.child_full_name, c.primary_contact_email, c.parent1_name, c.parent2_name,
      c.enrolment_date::text, c.class_name, c.programme, c.lunch_option
    FROM children c
    LEFT JOIN welcome_letters wl ON wl.child_id = c.id
    WHERE c.is_active = true
      AND c.primary_contact_email IS NOT NULL
      AND c.enrolment_date = CURRENT_DATE + ${daysBefore}::int
      AND wl.id IS NULL
  `) as unknown as ChildDueForWelcomeLetter[];
}
