import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { sendScheduleSessionReminderEmail } from '@/lib/email';
import { SCHOOL_TIMEZONE, SCHOOL_TIMEZONE_LABEL } from '@/lib/academic-calendar';

export const dynamic = 'force-dynamic';

interface ReminderRow {
  occurrence_id: number;
  starts_at: string;
  subject: string;
  format: 'online' | 'in_person';
  location_or_link: string | null;
  meet_link: string | null;
  teacher_label: string | null;
  child_id: number;
  child_full_name: string;
  customer_id: number;
  customer_name: string | null;
  customer_email: string;
}

function formatWhen(startsAt: string): string {
  return `${new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: SCHOOL_TIMEZONE,
  }).format(new Date(startsAt))} ${SCHOOL_TIMEZONE_LABEL}`;
}

/** Daily reminder for every upcoming session in the next 24 hours a parent has opted into (the
 * schedule notification toggle — off by default, per-child, see src/lib/schedule.ts). Filtered by
 * the child's schedule_type the same way the schedule view itself is (class_schedule_type_overrides
 * applies=false drops it entirely — no reminder for a session the child doesn't actually attend),
 * and deduped per (occurrence, customer) via schedule_reminders_sent so a session already reminded
 * about never sends twice even if the cron runs more than once. */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureSchema();

    const rows = (await sql`
      SELECT
        o.id AS occurrence_id, o.starts_at,
        cs.subject, COALESCE(ov.format_override, cs.format) AS format, cs.location_or_link, cs.meet_link,
        COALESCE(au.display_name, au.email) AS teacher_label,
        c.id AS child_id, c.child_full_name,
        cust.id AS customer_id, cust.name AS customer_name, cust.email AS customer_email
      FROM schedule_session_occurrences o
      JOIN class_schedule cs ON cs.id = o.class_schedule_id
      LEFT JOIN admin_users au ON au.id = cs.teacher_id
      JOIN children c ON c.class_name = cs.class_name
      LEFT JOIN class_schedule_type_overrides ov ON ov.class_schedule_id = cs.id AND ov.schedule_type = c.schedule_type
      JOIN guardian_children gc ON gc.child_id = c.id AND gc.status = 'approved'
      JOIN customers cust ON cust.id = gc.customer_id
      JOIN schedule_notification_prefs pref
        ON pref.customer_id = cust.id AND pref.child_id = c.id AND pref.class_schedule_id IS NULL AND pref.enabled = true
      LEFT JOIN schedule_reminders_sent sent ON sent.occurrence_id = o.id AND sent.customer_id = cust.id
      WHERE o.is_cancelled = false
        AND o.starts_at > now()
        AND o.starts_at <= now() + interval '24 hours'
        AND COALESCE(ov.applies, true) = true
        AND sent.occurrence_id IS NULL
    `) as unknown as ReminderRow[];

    let sentCount = 0;
    for (const row of rows) {
      const sent = await sendScheduleSessionReminderEmail({
        customerName: row.customer_name || 'there',
        customerEmail: row.customer_email,
        childName: row.child_full_name,
        subject: row.subject,
        whenLabel: formatWhen(row.starts_at),
        teacherLabel: row.teacher_label,
        format: row.format,
        meetLink: row.meet_link,
        locationOrLink: row.location_or_link,
      });
      if (sent) {
        await sql`
          INSERT INTO schedule_reminders_sent (occurrence_id, customer_id)
          VALUES (${row.occurrence_id}, ${row.customer_id})
          ON CONFLICT DO NOTHING
        `;
        sentCount++;
      }
    }

    return NextResponse.json({ ok: true, checked: rows.length, remindersSent: sentCount });
  } catch (err) {
    console.error('[api/cron/schedule-reminders] failed', err);
    return NextResponse.json({ error: 'Cron job failed.' }, { status: 500 });
  }
}
