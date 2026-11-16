import { ensureSchema } from '@/lib/db';
import { getCurrentSeranganAdmin } from '@/lib/current-serangan';
import { getObjectivesWithGoals } from '@/lib/serangan';
import SeranganNav from '@/components/serangan/SeranganNav';
import SeranganObjectivesManager from '@/components/serangan/SeranganObjectivesManager';

export const dynamic = 'force-dynamic';

export default async function SeranganObjectivesPage() {
  await ensureSchema();
  const admin = await getCurrentSeranganAdmin();
  const objectives = await getObjectivesWithGoals();

  return (
    <div className="min-h-screen bg-cream">
      <SeranganNav active="/serangan/objectives" role={admin.role} />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Objectives &amp; Goals</h1>
        <p className="mt-1 text-sm text-ink-soft">The school&apos;s main objectives, and the concrete goals toward achieving each one.</p>
        <div className="mt-6">
          <SeranganObjectivesManager initial={objectives} />
        </div>
      </div>
    </div>
  );
}
