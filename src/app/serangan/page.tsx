import Link from 'next/link';
import { ensureSchema } from '@/lib/db';
import { getSeranganReportData, getAllCampaigns } from '@/lib/serangan';
import SeranganNav from '@/components/serangan/SeranganNav';

export const dynamic = 'force-dynamic';

function formatIDR(n: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(n))}`;
}

export default async function SeranganOverviewPage() {
  await ensureSchema();
  const now = new Date();
  const yearStart = `${now.getUTCFullYear()}-01-01`;
  const yearEnd = `${now.getUTCFullYear()}-12-31`;
  const [report, campaigns] = await Promise.all([
    getSeranganReportData(yearStart, yearEnd, String(now.getUTCFullYear())),
    getAllCampaigns(),
  ]);

  const activeCampaigns = campaigns.filter((c) => c.status !== 'completed');

  return (
    <div className="min-h-screen bg-cream">
      <SeranganNav active="/serangan" />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Overview</h1>
        <p className="mt-1 text-sm text-ink-soft">{now.getUTCFullYear()} year-to-date, at a glance.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Sessions held" value={String(report.sessionsCount)} />
          <StatCard label="Children reached (total)" value={String(report.totalChildrenAttendance)} />
          <StatCard label="Donations received" value={formatIDR(report.donationsTotal)} />
          <StatCard label="Expenditure" value={formatIDR(report.expenditureTotal)} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold text-ink">Quick links</h2>
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/serangan/entries" className="text-sm font-semibold text-teal-deep hover:underline">
                + Log this week&apos;s session
              </Link>
              <Link href="/serangan/finances" className="text-sm font-semibold text-teal-deep hover:underline">
                Record a donation or expense
              </Link>
              <Link href="/serangan/campaigns" className="text-sm font-semibold text-teal-deep hover:underline">
                Manage campaigns
              </Link>
              <Link href="/serangan/reports" className="text-sm font-semibold text-teal-deep hover:underline">
                Generate a report
              </Link>
            </div>
          </div>

          <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold text-ink">Active &amp; planned campaigns</h2>
            <div className="mt-4 flex flex-col gap-2">
              {activeCampaigns.length === 0 && <p className="text-sm text-ink-soft">None right now.</p>}
              {activeCampaigns.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 rounded-sm border border-sand-line p-3 text-sm">
                  <span className="font-semibold text-ink">{c.title}</span>
                  <span className="rounded-full bg-orange/20 px-2.5 py-0.5 text-xs font-bold text-orange-deep">{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
