import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { sendOffboardingLetterSchema } from '@/lib/validation';
import { generateSurveyToken } from '@/lib/offboarding';
import { sendOffboardingLetterEmail } from '@/lib/email';
import { siteConfig } from '@/lib/site-content';

/** Create + send in one action, unlike Letter of Offer's draft-then-send flow — there's no
 * per-family content to edit first, just the child and the parent's email, so a separate "New"
 * step would only add friction. */
export async function POST(req: NextRequest) {
  const staff = await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = sendOffboardingLetterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();

    const children = await sql`SELECT id, child_full_name FROM children WHERE id = ${d.childId}`;
    const child = children[0] as { id: number; child_full_name: string } | undefined;
    if (!child) {
      return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
    }

    const surveyToken = generateSurveyToken();
    const surveyUrl = new URL(`/offboarding/${surveyToken}`, siteConfig.url).toString();

    const sent = await sendOffboardingLetterEmail({
      toEmail: d.email,
      childFullName: child.child_full_name,
      surveyUrl,
    });
    if (!sent) {
      return NextResponse.json({ error: 'Email could not be sent (check BREVO_API_KEY is set).' }, { status: 502 });
    }

    const rows = await sql`
      INSERT INTO offboarding_letters (child_id, survey_token, created_by)
      VALUES (${d.childId}, ${surveyToken}, ${staff.adminUserId})
      RETURNING id
    `;

    return NextResponse.json({ id: rows[0].id as number });
  } catch (err) {
    console.error('[api/admin/offboarding-letters] failed', err);
    return NextResponse.json({ error: 'Could not send off-boarding letter.' }, { status: 500 });
  }
}
