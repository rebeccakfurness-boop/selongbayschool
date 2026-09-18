import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getTeacherEmailsForClass } from '@/lib/current-staff';
import { sendBirthdayReminderEmail } from '@/lib/email';
import { getChildrenDueForBirthdayReminder, recordBirthdayReminderSent, BIRTHDAY_REMINDER_DAYS_BEFORE } from '@/lib/birthday-reminders';

export const dynamic = 'force-dynamic';

/** Daily reminder to a child's assigned teachers (and the school inbox) ahead of their birthday —
 * see getChildrenDueForBirthdayReminder for the matching/dedup logic. No PDF involved, so unlike
 * the welcome-letters cron this lives in the App Router like every other cron here. */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureSchema();
    const dueChildren = await getChildrenDueForBirthdayReminder(BIRTHDAY_REMINDER_DAYS_BEFORE);

    let sentCount = 0;
    for (const child of dueChildren) {
      try {
        const teacherEmails = await getTeacherEmailsForClass(child.class_name);
        const sent = await sendBirthdayReminderEmail({
          childFullName: child.child_full_name,
          className: child.class_name,
          turningAge: child.turning_age,
          birthdayDateLabel: child.birthday_date_label,
          daysBefore: BIRTHDAY_REMINDER_DAYS_BEFORE,
          teacherEmails,
        });

        if (sent) {
          await recordBirthdayReminderSent(child.id, child.birthday_year);
          sentCount++;
        }
      } catch (err) {
        console.error('[api/cron/birthday-reminders] failed for child', { childId: child.id, err });
      }
    }

    return NextResponse.json({ ok: true, dueCount: dueChildren.length, sentCount });
  } catch (err) {
    console.error('[api/cron/birthday-reminders] failed', err);
    return NextResponse.json({ error: 'Cron job failed.' }, { status: 500 });
  }
}
