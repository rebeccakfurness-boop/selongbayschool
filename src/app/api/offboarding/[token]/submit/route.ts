import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { submitOffboardingSurveySchema } from '@/lib/validation';
import { getOffboardingLetterByToken } from '@/lib/offboarding';
import { sendOffboardingSurveySubmittedNotification } from '@/lib/email';

/** Deliberately public and unauthenticated — same trust model as the Letter of Offer accept route:
 * the token (32 random bytes, emailed only to the parent) is the credential. A family that has just
 * left the school has no reason to still have a working portal login, so this can't be gated behind
 * customer auth. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = submitOffboardingSurveySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Please check your answers.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();

    const letter = await getOffboardingLetterByToken(token);
    if (!letter) {
      return NextResponse.json({ error: 'Survey not found.' }, { status: 404 });
    }
    if (letter.status === 'completed') {
      return NextResponse.json({ ok: true, alreadyCompleted: true });
    }

    await sql`
      UPDATE offboarding_letters SET
        status = 'completed',
        completed_at = now(),
        experience_rating = ${d.experienceRating},
        recommend_score = ${d.recommendScore},
        marketing_consent = ${d.marketingConsent},
        feedback_text = ${d.feedbackText ?? null},
        completed_by_name = ${d.completedByName}
      WHERE id = ${letter.id}
    `;

    await sendOffboardingSurveySubmittedNotification({
      childFullName: letter.child_full_name,
      completedByName: d.completedByName,
      experienceRating: d.experienceRating,
      recommendScore: d.recommendScore,
      marketingConsent: d.marketingConsent,
      feedbackText: d.feedbackText ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/offboarding/:token/submit] failed', err);
    return NextResponse.json({ error: 'Could not record your answers. Please contact the school office.' }, { status: 500 });
  }
}
