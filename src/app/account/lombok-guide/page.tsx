import { ensureSchema } from '@/lib/db';
import { getActiveGuideEntries, groupByCategory } from '@/lib/lombok-guide';
import AccountNav from '@/components/account/AccountNav';

export const dynamic = 'force-dynamic';

export default async function AccountLombokGuidePage() {
  await ensureSchema();
  const entries = await getActiveGuideEntries();
  const sections = groupByCategory(entries);

  return (
    <div className="min-h-screen bg-cream">
      <AccountNav active="/account/lombok-guide" />

      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Lombok Guide</h1>
            <p className="mt-1 text-sm text-ink-soft">Everything a family needs settling into Selong Belanak.</p>
          </div>
          <a
            href="/api/lombok-guide/pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-md border border-teal-deep px-4 py-2 text-sm font-semibold text-teal-deep hover:bg-teal-deep hover:text-white"
          >
            Download as PDF
          </a>
        </div>

        {sections.length === 0 && (
          <div className="mt-8 rounded-md border border-dashed border-sand-line bg-paper p-8 text-center">
            <p className="text-ink-soft">The guide is still being put together -- check back soon.</p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-8">
          {sections.map((section) => (
            <div key={section.category}>
              <h2 className="font-display text-lg font-semibold text-ink">{section.label}</h2>
              <div className="mt-3 flex flex-col gap-3">
                {section.entries.map((e) => (
                  <div key={e.id} className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
                    <p className="font-display text-base font-semibold text-ink">{e.title}</p>
                    <p className="mt-1.5 text-sm text-ink">{e.description}</p>
                    {(e.address || e.phone || e.website) && (
                      <p className="mt-2 text-xs text-ink-soft">
                        {e.address}
                        {e.address && e.phone && ' · '}
                        {e.phone}
                        {(e.address || e.phone) && e.website && ' · '}
                        {e.website && (
                          <a href={e.website.startsWith('http') ? e.website : `https://${e.website}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
                            {e.website}
                          </a>
                        )}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
