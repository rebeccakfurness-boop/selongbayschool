import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { getResourceRequestsForStaff, getAllResourceRequests } from '@/lib/resource-requests';
import ResourceRequestForm from '@/components/admin/ResourceRequestForm';
import ResourceRequestsManager from '@/components/admin/ResourceRequestsManager';

export const dynamic = 'force-dynamic';

export default async function ResourceRequestsPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const isAdmin = staff.role === 'admin';

  const [ownRequests, allRequests] = await Promise.all([
    getResourceRequestsForStaff(staff.adminUserId),
    isAdmin ? getAllResourceRequests() : Promise.resolve([]),
  ]);

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Resource &amp; Reimbursement Requests</h1>
      <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
        Ask for approval to buy resources or items for your classroom, and attach receipts or invoices to
        request reimbursement once purchased.
      </p>
      <div className="mt-6">
        <ResourceRequestForm initial={ownRequests} />
      </div>

      {isAdmin && (
        <div className="mt-12">
          <h2 className="font-display text-xl font-semibold text-ink">All Requests (Office View)</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Every request submitted across the school — pending decisions first, then approved requests
            awaiting reimbursement.
          </p>
          <div className="mt-4">
            <ResourceRequestsManager initial={allRequests} />
          </div>
        </div>
      )}
    </section>
  );
}
