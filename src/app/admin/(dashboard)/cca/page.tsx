import Link from 'next/link';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { formatIDR } from '@/lib/site-content';
import { getCcaSettings, getAllCcaSelectionsForAdmin } from '@/lib/cca';
import CcaSettingsForm from '@/components/admin/CcaSettingsForm';
import CcaActivitiesManager from '@/components/admin/CcaActivitiesManager';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-orange/20 text-orange-deep',
  invoiced: 'bg-teal/15 text-teal-deep',
};

export default async function CcaAdminPage() {
  await requireAdmin();
  await ensureSchema();

  const settings = await getCcaSettings();
  const selections = settings.term_label ? await getAllCcaSelectionsForAdmin(settings.term_label) : [];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Co-Curricular Activities</h1>

      <CcaSettingsForm initial={settings} />
      <CcaActivitiesManager />

      <section>
        <h2 className="font-display text-xl font-semibold text-ink">
          Submissions {settings.term_label && <span className="text-ink-soft">— {settings.term_label}</span>}
        </h2>
        <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-sand-line bg-sand/40 text-left">
                <th className="px-4 py-3 font-bold text-ink-soft">Child</th>
                <th className="px-4 py-3 font-bold text-ink-soft">CCAs selected</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Total</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Status</th>
                <th className="px-4 py-3 font-bold text-ink-soft"></th>
              </tr>
            </thead>
            <tbody>
              {selections.map((s) => (
                <tr key={s.selection_id} className="border-b border-sand-line/60 last:border-0">
                  <td className="px-4 py-3 font-semibold text-ink">
                    <Link href={`/admin/families/${s.child_id}`} className="hover:underline">
                      {s.child_full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-ink-soft">{s.item_count}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{formatIDR(s.total_amount_idr)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold capitalize ${STATUS_STYLES[s.status]}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.status === 'submitted' ? (
                      <Link href={`/admin/families/${s.child_id}/cca`} className="text-sm font-semibold text-teal-deep hover:underline">
                        Review &amp; invoice &rarr;
                      </Link>
                    ) : (
                      s.invoice_number != null && (
                        <a href={`/api/invoices/${s.invoice_id}/pdf`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-teal-deep underline">
                          Invoice #{String(s.invoice_number).padStart(3, '0')}
                        </a>
                      )
                    )}
                  </td>
                </tr>
              ))}
              {selections.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-ink-soft">No submissions yet for this term.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
