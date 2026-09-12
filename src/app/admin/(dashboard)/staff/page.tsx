import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getStaffForBoard } from '@/lib/staff-hr';
import StaffBoard from '@/components/admin/StaffBoard';
import StaffTabs from '@/components/admin/StaffTabs';

export const dynamic = 'force-dynamic';

/** Admin-only, unlike the Family Board (which teachers can view read-only) -- this carries every
 * staff member's employment pipeline stage, which isn't something a colleague should be able to
 * browse even read-only. */
export default async function TeacherBoardPage() {
  await requireAdmin();
  await ensureSchema();
  const staff = await getStaffForBoard();

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Teacher Board</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            Recruitment and employment pipeline for every staff member, from application through to leaving. Drag a
            card to move it; click a name for their full Staff Card.
          </p>
        </div>
        <StaffTabs active="board" />
      </div>
      <div className="mt-6">
        <StaffBoard initialStaff={staff} canEdit />
      </div>
    </section>
  );
}
