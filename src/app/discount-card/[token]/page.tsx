import { ensureSchema } from '@/lib/db';
import { getFamilyCardPublicData } from '@/lib/family-discount';

export const dynamic = 'force-dynamic';

/** What a local partner business actually scans -- deliberately public (no login), since a
 * restaurant or activity host has no portal account. Shows only the minimum needed to honour a
 * discount: a first name, the two headcounts, and a join year. Not in the proxy middleware's
 * matcher, so this route is reachable without a session by design. */
export default async function DiscountCardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await ensureSchema();
  const card = await getFamilyCardPublicData(token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-teal-deep px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-paper p-8 text-center shadow-[0_24px_60px_-20px_rgba(0,0,0,0.4)]">
        <p className="font-script text-3xl text-teal">Selong Bay School</p>
        <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-ink-soft">Selong Families Discount Card</p>

        {card ? (
          <>
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="rounded-full bg-teal/15 px-4 py-1.5 text-sm font-bold text-teal-deep">✓ Verified Family</span>
            </div>
            <p className="mt-6 font-display text-2xl font-semibold text-ink">{card.firstName}&apos;s Family</p>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div>
                <p className="font-display text-3xl font-bold text-teal-deep">{card.adultsInHousehold}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Adult{card.adultsInHousehold === 1 ? '' : 's'}</p>
              </div>
              <div className="h-10 w-px bg-sand-line" />
              <div>
                <p className="font-display text-3xl font-bold text-teal-deep">{card.childrenCount}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Child{card.childrenCount === 1 ? '' : 'ren'}</p>
              </div>
            </div>
            <p className="mt-6 text-xs text-ink-soft">Member since {card.memberSinceYear}</p>
          </>
        ) : (
          <p className="mt-8 text-sm font-semibold text-orange-deep">This card isn&apos;t recognised -- please check with the school office.</p>
        )}
      </div>
    </div>
  );
}
