import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getAllPartnerDiscounts } from '@/lib/family-discount';
import PartnerDiscountsManager from '@/components/admin/PartnerDiscountsManager';

export const dynamic = 'force-dynamic';

export default async function AdminPartnerDiscountsPage() {
  await requireAdmin();
  await ensureSchema();
  const discounts = await getAllPartnerDiscounts();

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Partner Discounts</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Local restaurant and activity discounts shown on every family&apos;s Selong Families Discount Card page.
      </p>
      <div className="mt-6">
        <PartnerDiscountsManager initial={discounts} />
      </div>
    </section>
  );
}
