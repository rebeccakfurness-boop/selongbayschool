import { ensureSchema } from '@/lib/db';
import { getAllCampaigns } from '@/lib/serangan';
import SeranganNav from '@/components/serangan/SeranganNav';
import SeranganCampaignsManager from '@/components/serangan/SeranganCampaignsManager';

export const dynamic = 'force-dynamic';

export default async function SeranganCampaignsPage() {
  await ensureSchema();
  const campaigns = await getAllCampaigns();

  return (
    <div className="min-h-screen bg-cream">
      <SeranganNav active="/serangan/campaigns" />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Campaigns</h1>
        <p className="mt-1 text-sm text-ink-soft">One-off initiatives alongside the regular weekly sessions.</p>
        <div className="mt-6">
          <SeranganCampaignsManager initial={campaigns} />
        </div>
      </div>
    </div>
  );
}
