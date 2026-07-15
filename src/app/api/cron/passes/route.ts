import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { sendPassCompletionEmail, sendPassExpiryReminderEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

interface PassWithCustomer {
  id: number;
  child_name: string;
  total_sessions: number;
  sessions_used: number;
  expires_at: string;
  customer_name: string | null;
  customer_email: string;
}

function formatExpiresAt(value: string): string {
  return new Date(value).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Makassar',
  });
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  // Explicitly require CRON_SECRET to be configured, rather than comparing against
  // `Bearer ${undefined}` when it's unset, which a request literally sending the string
  // "Bearer undefined" would otherwise pass.
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureSchema();

    let completionEmailsSent = 0;
    let reminderEmailsSent = 0;

    // 1. Fully-used packs that haven't had their completion email yet.
    const completedPasses = (await sql`
      SELECT p.id, p.child_name, p.total_sessions, p.sessions_used, p.expires_at,
             c.name AS customer_name, c.email AS customer_email
      FROM passes p
      JOIN customers c ON c.id = p.customer_id
      WHERE p.status = 'paid' AND p.sessions_used >= p.total_sessions AND p.completion_email_sent = false
    `) as unknown as PassWithCustomer[];

    for (const pass of completedPasses) {
      const sent = await sendPassCompletionEmail({
        customerName: pass.customer_name || 'there',
        customerEmail: pass.customer_email,
        childName: pass.child_name,
        totalSessions: pass.total_sessions,
      });
      if (sent) {
        completionEmailsSent++;
        await sql`UPDATE passes SET completion_email_sent = true WHERE id = ${pass.id}`;
      }
    }

    // 2. Packs expiring within 7 days that aren't already fully used (that's handled above, and
    // deliberately excludes it here so a pack never gets both emails) and haven't had their
    // reminder yet. Excludes already-expired passes too, a reminder that a pack "expires in a
    // week" would make no sense once it's already expired.
    const expiringPasses = (await sql`
      SELECT p.id, p.child_name, p.total_sessions, p.sessions_used, p.expires_at,
             c.name AS customer_name, c.email AS customer_email
      FROM passes p
      JOIN customers c ON c.id = p.customer_id
      WHERE p.status = 'paid'
        AND p.expires_at > now()
        AND p.expires_at <= now() + interval '7 days'
        AND p.expiry_reminder_sent = false
        AND p.completion_email_sent = false
    `) as unknown as PassWithCustomer[];

    for (const pass of expiringPasses) {
      const sent = await sendPassExpiryReminderEmail({
        customerName: pass.customer_name || 'there',
        customerEmail: pass.customer_email,
        childName: pass.child_name,
        sessionsRemaining: pass.total_sessions - pass.sessions_used,
        expiresAt: formatExpiresAt(pass.expires_at),
      });
      if (sent) {
        reminderEmailsSent++;
        await sql`UPDATE passes SET expiry_reminder_sent = true WHERE id = ${pass.id}`;
      }
    }

    // 3. Passes past their expiry date that were never fully used just age out silently (no
    // email), so they stop being offered at checkout.
    const expiredResult = await sql`
      UPDATE passes SET status = 'expired'
      WHERE status = 'paid' AND expires_at < now() AND sessions_used < total_sessions
      RETURNING id
    `;

    return NextResponse.json({
      ok: true,
      completionEmailsSent,
      reminderEmailsSent,
      passesExpired: expiredResult.length,
    });
  } catch (err) {
    console.error('[api/cron/passes] failed', err);
    return NextResponse.json({ error: 'Cron job failed.' }, { status: 500 });
  }
}
