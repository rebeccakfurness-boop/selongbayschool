import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { ensureSchema, sql } from '@/lib/db';
import { guardianOwnsChild } from '@/lib/lms-data';
import { createParentFeedbackSchema } from '@/lib/validation';
import { createParentFeedback, markFeedbackNotifyStatus, FEEDBACK_CATEGORY_LABELS } from '@/lib/parent-feedback';
import { sendParentFeedbackNotification } from '@/lib/email';

export async function POST(req: NextRequest) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId || !session.email) {
    return NextResponse.json({ error: 'Please log in to submit this.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = createParentFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid submission.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();

    if (d.childId && !(await guardianOwnsChild(session.customerId, d.childId))) {
      return NextResponse.json({ error: 'That child is not linked to your account.' }, { status: 403 });
    }

    const [customer] = (await sql`SELECT name FROM customers WHERE id = ${session.customerId}`) as unknown as {
      name: string | null;
    }[];
    const childFullName = d.childId
      ? ((await sql`SELECT child_full_name FROM children WHERE id = ${d.childId}`) as unknown as { child_full_name: string }[])[0]
          ?.child_full_name ?? null
      : null;

    const { id } = await createParentFeedback(session.customerId, d);

    const sent = await sendParentFeedbackNotification({
      parentName: customer?.name || session.email,
      parentEmail: session.email,
      childFullName,
      categoryLabel: FEEDBACK_CATEGORY_LABELS[d.category] ?? d.category,
      description: d.description,
      desiredOutcome: d.desiredOutcome ?? null,
      urgent: d.urgent ?? false,
    });
    await markFeedbackNotifyStatus(id, sent ? 'sent' : 'failed');

    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/account/feedback] failed to submit', err);
    return NextResponse.json({ error: 'Could not submit your feedback. Please try again.' }, { status: 500 });
  }
}
