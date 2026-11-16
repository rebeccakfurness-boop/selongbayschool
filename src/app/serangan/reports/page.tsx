import { requireSeranganAdmin } from '@/lib/current-serangan';
import SeranganNav from '@/components/serangan/SeranganNav';
import SeranganReportsPanel from '@/components/serangan/SeranganReportsPanel';

export const dynamic = 'force-dynamic';

export default async function SeranganReportsPage() {
  const admin = await requireSeranganAdmin();
  return (
    <div className="min-h-screen bg-cream">
      <SeranganNav active="/serangan/reports" role={admin.role} />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Reports</h1>
        <p className="mt-1 text-sm text-ink-soft">Generate a PDF report for a month, quarter, or year.</p>
        <div className="mt-6">
          <SeranganReportsPanel />
        </div>
      </div>
    </div>
  );
}
