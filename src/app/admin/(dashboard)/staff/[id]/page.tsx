import Link from 'next/link';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { getStaffDetail } from '@/lib/staff-hr';
import StaffCard from '@/components/admin/StaffCard';

export const dynamic = 'force-dynamic';

/** Viewable by an admin, or by the staff member looking at their own card (self-service: their
 * own upcoming PD, lunch requests, and payslips) -- nobody else. Editing the HR fields themselves
 * stays admin-only (see StaffCard's canEdit prop). */
export default async function StaffCardPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const currentStaff = await getCurrentStaff();
  const { id: idParam } = await params;
  const adminUserId = Number(idParam);
  if (!Number.isInteger(adminUserId)) {
    return <NotFound />;
  }

  const isSelf = String(currentStaff.adminUserId) === String(adminUserId);
  const isAdmin = currentStaff.role === 'admin';
  if (!isAdmin && !isSelf) {
    return (
      <section>
        <h1 className="font-display text-2xl font-semibold text-ink">Not available</h1>
        <p className="mt-2 text-sm text-ink-soft">You can only view your own Staff Card.</p>
      </section>
    );
  }

  const staff = await getStaffDetail(adminUserId);
  if (!staff) {
    return <NotFound />;
  }

  return (
    <section>
      {isAdmin && (
        <p className="mb-4 text-xs font-bold uppercase tracking-wide text-ink-soft">
          <Link href="/admin/staff" className="hover:underline">Teacher Board</Link> / Staff Card
        </p>
      )}
      <StaffCard staff={staff} canEdit={isAdmin} isSelf={isSelf} />
    </section>
  );
}

function NotFound() {
  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Staff member not found</h1>
      <Link href="/admin/staff" className="mt-4 inline-block text-sm font-semibold text-teal-deep underline">
        ← Back to Teacher Board
      </Link>
    </section>
  );
}
