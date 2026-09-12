import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getLoansDueTomorrow, sendDueSoonReminderForLoan } from '@/lib/library';

export const dynamic = 'force-dynamic';

/** Daily reminder for any library loan due back tomorrow — see sendDueSoonReminderForLoan in
 * lib/library.ts, also used by the admin's manual "Send reminder" button. */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureSchema();
    const dueTomorrow = await getLoansDueTomorrow();

    let sentCount = 0;
    for (const loan of dueTomorrow) {
      try {
        await sendDueSoonReminderForLoan(loan.id);
        sentCount++;
      } catch (err) {
        console.error('[api/cron/library-due-reminders] failed for loan', { loanId: loan.id, err });
      }
    }

    return NextResponse.json({ ok: true, dueCount: dueTomorrow.length, sentCount });
  } catch (err) {
    console.error('[api/cron/library-due-reminders] failed', err);
    return NextResponse.json({ error: 'Cron job failed.' }, { status: 500 });
  }
}
