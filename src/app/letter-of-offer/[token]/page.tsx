import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ensureSchema } from '@/lib/db';
import { getLetterOfOfferByToken } from '@/lib/letters-of-offer';
import { formatDate } from '@/lib/admin-format';
import LetterOfOfferAcceptForm from '@/components/LetterOfOfferAcceptForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Letter of Offer',
  description: 'Review and accept your Letter of Offer from Selong Bay School.',
};

export default async function LetterOfOfferPage({ params }: { params: Promise<{ token: string }> }) {
  await ensureSchema();
  const { token } = await params;
  const letter = await getLetterOfOfferByToken(token);
  if (!letter) notFound();

  const parents = [letter.parent1_name, letter.parent2_name].filter(Boolean).join(' and ');
  const pdfUrl = `/api/letters-of-offer/${letter.id}/pdf?token=${token}`;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:px-8 md:py-20">
      <p className="font-script text-3xl text-orange-deep">Letter of Offer</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink md:text-3xl">{letter.child_full_name}</h1>
      {parents && <p className="mt-1 text-sm text-ink-soft">Dear {parents},</p>}

      <div className="mt-6 rounded-md border border-teal/30 bg-paper p-6 shadow-soft">
        <p className="text-sm leading-relaxed text-ink">
          We are delighted to offer {letter.child_full_name} a place at Selong Bay School. Please review the details
          below and download the full letter for your records.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">Start date</dt>
            <dd className="mt-0.5 text-sm text-ink">{formatDate(letter.start_date)}</dd>
          </div>
          {letter.programme && (
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">Programme</dt>
              <dd className="mt-0.5 text-sm text-ink">{letter.programme}</dd>
            </div>
          )}
          {letter.class_name && (
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">Class</dt>
              <dd className="mt-0.5 text-sm text-ink">{letter.class_name}</dd>
            </div>
          )}
          {letter.tuition_plan && (
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">Tuition plan</dt>
              <dd className="mt-0.5 text-sm text-ink">{letter.tuition_plan}</dd>
            </div>
          )}
        </dl>
        {letter.fees_note && <p className="mt-4 text-sm text-ink-soft">{letter.fees_note}</p>}
        {letter.additional_terms && <p className="mt-4 whitespace-pre-line text-sm text-ink-soft">{letter.additional_terms}</p>}

        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-teal-deep underline">
          View / download full letter (PDF)
        </a>
      </div>

      <div className="mt-6">
        {letter.status === 'accepted' ? (
          <div className="rounded-md border border-teal/30 bg-teal/10 p-6 text-center">
            <p className="font-display text-lg font-semibold text-teal-deep">
              Accepted{letter.accepted_by_name ? ` by ${letter.accepted_by_name}` : ''}
              {letter.accepted_at ? ` on ${formatDate(letter.accepted_at.slice(0, 10))}` : ''}.
            </p>
            <p className="mt-2 text-sm text-ink-soft">Thank you — we&apos;ll be in touch with the tuition invoice shortly.</p>
          </div>
        ) : (
          <LetterOfOfferAcceptForm token={token} />
        )}
      </div>
    </div>
  );
}
