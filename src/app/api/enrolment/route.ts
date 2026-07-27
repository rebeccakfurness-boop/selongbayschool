import { NextRequest, NextResponse } from 'next/server';
import { enrolmentSchema } from '@/lib/validation';
import { submitEnrolment } from '@/lib/enrolments';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = enrolmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Please check the form and try again.' }, { status: 400 });
  }

  try {
    const result = await submitEnrolment(parsed.data);
    return NextResponse.json({
      ok: true,
      id: result.id,
      emailWarning: !result.notifySent
        ? 'Your enrolment details were saved, but our notification email could not be sent. We will still follow up.'
        : undefined,
    });
  } catch (err) {
    console.error('[api/enrolment] failed to submit enrolment', err);
    return NextResponse.json({ error: 'Could not submit your enrolment right now. Please try again shortly or email us directly.' }, { status: 500 });
  }
}
