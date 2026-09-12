import type { Metadata } from 'next';
import Button from '@/components/Button';
import { ensureSchema, sql } from '@/lib/db';
import { onlineLibrary, formatIDR } from '@/lib/site-content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Library',
  description: 'Borrow books, toys and sports equipment from the Selong Bay School library, managed through your parent account.',
  openGraph: { title: 'Library - Selong Bay School' },
};

const catalogueIcons = [
  {
    label: 'Books',
    type: 'book',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    label: 'Toys & Games',
    type: 'toy',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="13.5" width="6" height="6" rx="1" />
        <rect x="14.5" y="13.5" width="6" height="6" rx="1" />
        <rect x="9" y="4.5" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Sports Gear',
    type: 'sports_equipment',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14.5a8 8 0 0 1 16 0" />
        <path d="M4 14.5h16v2.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        <path d="M8.5 10.5c1.2-.9 2.2-.9 3.5 0 1.3-.9 2.3-.9 3.5 0" />
      </svg>
    ),
  },
  {
    label: 'Other',
    type: 'other',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 16v.01M12 8a2.5 2.5 0 0 1 2.5 2.5c0 1.5-2.5 2-2.5 3.5" />
      </svg>
    ),
  },
];

interface CatalogueCount {
  item_type: string;
  total: number;
  available: number;
}

export default async function OnlineLibraryPage() {
  await ensureSchema();
  const [counts, settingsRows] = await Promise.all([
    sql`
      SELECT li.item_type, count(*)::int AS total,
        count(*)::int - COALESCE(sum((SELECT count(*) FROM library_loans l WHERE l.item_id = li.id AND l.returned_at IS NULL)), 0)::int AS available
      FROM library_items li WHERE li.is_active = true
      GROUP BY li.item_type
    ` as unknown as Promise<CatalogueCount[]>,
    sql`SELECT monthly_membership_fee_idr FROM library_settings WHERE id = 1` as unknown as Promise<{ monthly_membership_fee_idr: number }[]>,
  ]);
  const countsByType = new Map(counts.map((c) => [c.item_type, c]));
  const monthlyFee = settingsRows[0]?.monthly_membership_fee_idr ?? 0;

  return (
    <div className="flex flex-col items-center px-6 py-20 text-center md:px-8 md:py-28">
      <p className="font-script text-3xl text-orange-deep md:text-4xl">For our students and families</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Library</h1>

      <div className="mt-4 max-w-lg space-y-4 text-[15px] leading-relaxed text-ink-soft">
        {onlineLibrary.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-8 flex gap-6 sm:gap-10">
        {catalogueIcons.map((item) => {
          const count = countsByType.get(item.type);
          return (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-aqua/50 text-teal-deep">{item.icon}</span>
              <span className="text-xs font-bold uppercase tracking-wide text-teal-deep">{item.label}</span>
              {count && <span className="text-xs text-ink-soft">{count.available} of {count.total} available</span>}
            </div>
          );
        })}
      </div>

      <div className="mt-8 w-full max-w-md rounded-lg border border-sand-line bg-paper p-8 shadow-soft">
        <h2 className="font-display text-xl font-semibold text-ink">Membership</h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
          {monthlyFee > 0 ? (
            <>
              Join for <span className="font-semibold text-ink">{formatIDR(monthlyFee)}</span> / month, billed on top of school fees. Long-term
              families may be given a discount code for free or reduced-price access.
            </>
          ) : (
            'Join from your parent account — a small monthly fee on top of school fees.'
          )}
        </p>
        <Button href="/account/library" variant="primary" fullWidth className="mt-5">
          Go to My Library Account
        </Button>
      </div>

      <p className="mt-6 max-w-md text-sm text-ink-soft">
        Have a question about the library, or want to suggest a title? Contact us at{' '}
        <a href="mailto:hello@selongbayschool.com" className="font-semibold text-teal-deep underline">
          hello@selongbayschool.com
        </a>
        .
      </p>
    </div>
  );
}
