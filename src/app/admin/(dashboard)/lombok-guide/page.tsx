import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getAllGuideEntries } from '@/lib/lombok-guide';
import LombokGuideManager from '@/components/admin/LombokGuideManager';

export const dynamic = 'force-dynamic';

export default async function AdminLombokGuidePage() {
  await requireAdmin();
  await ensureSchema();
  const entries = await getAllGuideEntries();

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Lombok Guide</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Settling-in info for new families -- car rentals, local attractions, activities, where to buy food, medical
        services, real estate agents, and anything else they&apos;ll want to know moving to the Selong Belanak area.
        Shown in the parent portal and sent as a PDF via the &ldquo;Send Lombok Guide&rdquo; action on a Child Card.
      </p>
      <p className="mt-2">
        <a href="/api/lombok-guide/pdf" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-teal-deep underline">
          Preview current PDF
        </a>
      </p>
      <div className="mt-6">
        <LombokGuideManager initial={entries} />
      </div>
    </section>
  );
}
