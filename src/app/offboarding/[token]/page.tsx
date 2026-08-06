import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ensureSchema } from '@/lib/db';
import { getOffboardingLetterByToken } from '@/lib/offboarding';
import { siteConfig } from '@/lib/site-content';
import OffboardingSurveyForm from '@/components/OffboardingSurveyForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Thank You',
  description: 'A note from Selong Bay School, and a short exit survey.',
};

export default async function OffboardingLetterPage({ params }: { params: Promise<{ token: string }> }) {
  await ensureSchema();
  const { token } = await params;
  const letter = await getOffboardingLetterByToken(token);
  if (!letter) notFound();

  const parents = [letter.parent1_name, letter.parent2_name].filter(Boolean).join(' and ');

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:px-8 md:py-20">
      <p className="font-script text-3xl text-orange-deep">Thank you</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink md:text-3xl">{letter.child_full_name}</h1>
      {parents && <p className="mt-1 text-sm text-ink-soft">Dear {parents},</p>}

      <div className="mt-6 rounded-md border border-teal/30 bg-paper p-6 shadow-soft">
        <p className="text-sm leading-relaxed text-ink">
          Thank you for being part of the Selong Bay School community. It has been a privilege to spend this time
          with {letter.child_full_name}, and we wish your family all the very best for whatever comes next.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink">
          We&apos;d love to stay in touch — follow us on Instagram{' '}
          <a href={siteConfig.contact.instagram} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
            @selongbay_school
          </a>{' '}
          for updates, photos, and news from the school, and if your family&apos;s plans ever bring you back to
          Lombok, we&apos;d love to welcome you again.
        </p>
      </div>

      <div className="mt-6">
        {letter.status === 'completed' ? (
          <div className="rounded-md border border-teal/30 bg-teal/10 p-6 text-center">
            <p className="font-display text-lg font-semibold text-teal-deep">Thank you — feedback already received!</p>
            <p className="mt-2 text-sm text-ink-soft">We really appreciate you taking the time to share it with us.</p>
          </div>
        ) : (
          <OffboardingSurveyForm token={token} />
        )}
      </div>
    </div>
  );
}
