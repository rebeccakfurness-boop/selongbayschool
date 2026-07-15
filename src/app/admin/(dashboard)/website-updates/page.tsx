import { ensureSchema, sql } from '@/lib/db';
import { formatDateTime } from '@/lib/admin-format';

export const dynamic = 'force-dynamic';

interface ChangeRequestRow {
  id: number;
  requested_by: string;
  request_text: string;
  status: string;
  github_pr_url: string | null;
  github_pr_number: number | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Submitted',
  in_progress: 'In progress',
  pr_open: 'PR open',
  approved: 'Approved',
  merged: 'Merged',
  rejected: 'Rejected',
};

export default async function WebsiteUpdatesPage() {
  await ensureSchema();
  const requests = (await sql`
    SELECT id, requested_by, request_text, status, github_pr_url, github_pr_number, created_at
    FROM change_requests ORDER BY created_at DESC LIMIT 200
  `) as unknown as ChangeRequestRow[];

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">Website Updates</h1>
        <span className="inline-block rounded-full bg-orange/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-orange-deep">
          Coming Soon
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-[15px] font-semibold text-teal-deep">
        Soon you&apos;ll be able to type a change straight into this page and watch it go live on the
        site. Coming in the next update!
      </p>
      <p className="mt-2 text-sm text-ink-soft">
        Requested changes to the website and their status. {requests.length} total.
      </p>
      <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">Requested</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Requested by</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Request</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Status</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Pull request</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((row) => (
              <tr key={row.id} className="border-b border-sand-line/60 last:border-0 align-top">
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDateTime(row.created_at)}</td>
                <td className="px-4 py-3 text-ink">{row.requested_by}</td>
                <td className="max-w-md px-4 py-3 text-ink-soft">{row.request_text}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">
                  {STATUS_LABEL[row.status] ?? row.status}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {row.github_pr_url ? (
                    <a href={row.github_pr_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep hover:underline">
                      PR #{row.github_pr_number}
                    </a>
                  ) : (
                    <span className="text-ink-soft">-</span>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-soft">
                  No website update requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
