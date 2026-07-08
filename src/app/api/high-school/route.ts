import { NextRequest, NextResponse } from 'next/server';
import { highSchoolSchema } from '@/lib/validation';
import { submitEnquiry } from '@/lib/enquiries';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = highSchoolSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Please check the form and try again.' }, { status: 400 });
  }

  try {
    const result = await submitEnquiry({ type: 'high_school', interest: 'High School', ...parsed.data });
    return NextResponse.json({
      ok: true,
      id: result.id,
      emailWarning: !result.notifySent
        ? 'Your enquiry was saved, but our notification email could not be sent — we will still follow up.'
        : undefined,
    });
  } catch (err) {
    console.error('[api/high-school] failed to submit enquiry', err);
    return NextResponse.json({ error: 'Could not submit your enquiry right now. Please try again shortly or email us directly.' }, { status: 500 });
  }
}
