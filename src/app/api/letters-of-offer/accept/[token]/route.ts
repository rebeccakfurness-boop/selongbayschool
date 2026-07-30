import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { acceptLetterOfOfferSchema } from '@/lib/validation';
import { getLetterOfOfferByToken } from '@/lib/letters-of-offer';
import { sendLetterOfOfferAcceptedNotification, sendLetterOfOfferAcceptedConfirmation } from '@/lib/email';
import { siteConfig } from '@/lib/site-content';

/** Deliberately public and unauthenticated — the token itself (a 32-byte random value, emailed
 * only to the parent) is the credential, the same trust model as the password-reset and magic-link
 * flows elsewhere in this app. A family at Letter of Offer stage usually has no portal account yet,
 * so gating this behind customer login would block the exact people it's for. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = acceptLetterOfOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Enter your name.' }, { status: 400 });
  }

  try {
    await ensureSchema();

    const letter = await getLetterOfOfferByToken(token);
    if (!letter) {
      return NextResponse.json({ error: 'Letter of offer not found.' }, { status: 404 });
    }
    if (letter.status === 'accepted') {
      return NextResponse.json({ ok: true, alreadyAccepted: true });
    }

    await sql`
      UPDATE letters_of_offer SET
        status = 'accepted',
        accepted_at = now(),
        accepted_by_name = ${parsed.data.acceptedByName}
      WHERE id = ${letter.id}
    `;

    const createInvoiceUrl = new URL(`/admin/families/${letter.child_id}/invoices/new?type=tuition`, siteConfig.url).toString();
    await sendLetterOfOfferAcceptedNotification({
      childFullName: letter.child_full_name,
      acceptedByName: parsed.data.acceptedByName,
      createInvoiceUrl,
    });

    if (letter.primary_contact_email) {
      await sendLetterOfOfferAcceptedConfirmation(letter.primary_contact_email, letter.child_full_name);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/letters-of-offer/:token/accept] failed', err);
    return NextResponse.json({ error: 'Could not record your acceptance. Please contact the school office.' }, { status: 500 });
  }
}
