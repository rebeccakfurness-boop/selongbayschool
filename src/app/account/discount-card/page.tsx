import QRCode from 'qrcode';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { ensureDiscountCardToken, getAdultsInHousehold, getChildrenCountForCustomer, getActivePartnerDiscounts } from '@/lib/family-discount';
import { siteConfig } from '@/lib/site-content';
import AccountNav from '@/components/account/AccountNav';
import AdultsInHouseholdEditor from '@/components/account/AdultsInHouseholdEditor';

export const dynamic = 'force-dynamic';

const CATEGORY_LABEL: Record<string, string> = { restaurant: '🍽️ Restaurant', activity: '🎉 Activity', other: '🏷️ Offer' };

export default async function DiscountCardPage() {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    redirect('/account/login?next=/account/discount-card');
  }

  await ensureSchema();
  const [token, adults, childrenCount, discounts] = await Promise.all([
    ensureDiscountCardToken(session.customerId),
    getAdultsInHousehold(session.customerId),
    getChildrenCountForCustomer(session.customerId),
    getActivePartnerDiscounts(),
  ]);

  const cardUrl = `${siteConfig.url}/discount-card/${token}`;
  const qrDataUrl = await QRCode.toDataURL(cardUrl, { margin: 1, width: 280, color: { dark: '#045157', light: '#fffdf8' } });

  return (
    <div className="min-h-screen bg-cream">
      <AccountNav active="/account/discount-card" />

      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Selong Families Discount</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Show this QR code at any partner restaurant or activity below to claim your family discount.
        </p>

        <div className="mt-8 flex flex-col items-center rounded-2xl border border-sand-line bg-paper p-8 text-center shadow-soft">
          <p className="font-script text-2xl text-teal">Selong Bay School</p>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Selong Families Discount Card</p>

          {/* eslint-disable-next-line @next/next/no-img-element -- a generated data: URL, not a remote image next/image can optimize */}
          <img src={qrDataUrl} alt="Scan to verify your Selong Bay School family discount card" width={220} height={220} className="mt-5 rounded-md border border-sand-line" />

          <div className="mt-5 flex items-center justify-center gap-8">
            <AdultsInHouseholdEditor initial={adults} />
            <div className="h-10 w-px bg-sand-line" />
            <div>
              <p className="font-display text-3xl font-bold text-teal-deep">{childrenCount}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Child{childrenCount === 1 ? '' : 'ren'}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-ink-soft">Children are counted automatically from your enrolled family.</p>
        </div>

        <h2 className="mt-10 font-display text-xl font-semibold text-ink">Partner Discounts</h2>
        <p className="mt-1 text-sm text-ink-soft">Local restaurants and activities offering a discount to Selong Bay School families.</p>

        {discounts.length === 0 && (
          <div className="mt-6 rounded-md border border-dashed border-sand-line bg-paper p-8 text-center">
            <p className="text-ink-soft">No partner discounts have been added yet -- check back soon.</p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {discounts.map((d) => (
            <div key={d.id} className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-display text-base font-semibold text-ink">{d.business_name}</p>
                <span className="shrink-0 rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal-deep">{CATEGORY_LABEL[d.category]}</span>
              </div>
              <p className="mt-1.5 text-sm text-ink">{d.discount_description}</p>
              {(d.address || d.phone || d.website) && (
                <p className="mt-2 text-xs text-ink-soft">
                  {d.address}
                  {d.address && d.phone && ' · '}
                  {d.phone}
                  {(d.address || d.phone) && d.website && ' · '}
                  {d.website && (
                    <a href={d.website.startsWith('http') ? d.website : `https://${d.website}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
                      {d.website}
                    </a>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
