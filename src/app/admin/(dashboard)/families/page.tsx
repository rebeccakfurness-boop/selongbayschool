import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { STATUS_LEGEND, STATUS_ORDER } from '@/lib/family-data';
import FamiliesTabs from '@/components/admin/FamiliesTabs';
import FamilyBoard, { type BoardChild } from '@/components/admin/FamilyBoard';

export const dynamic = 'force-dynamic';

export default async function FamiliesBoardPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();

  let assignedClasses: string[] = [];
  if (staff.role === 'teacher') {
    const rows = (await sql`
      SELECT class_name FROM teacher_assignments WHERE admin_user_id = ${staff.adminUserId}
    `) as unknown as { class_name: string }[];
    assignedClasses = rows.map((r) => r.class_name);
  }

  const children = (await sql`
    SELECT
      id, status, is_active, class_name, class_band, child_full_name, child_nickname,
      parent1_name, parent2_name, allergies_medical_notes, enrolment_date,
      (liability_form_signed::int + photography_signed::int + pickup_authorization_signed::int +
       behavioral_form_signed::int + financial_agreement_signed::int +
       parent_protection_addendum_signed::int + data_consent_signed::int) AS compliance_signed_count
    FROM children
    WHERE ${staff.role === 'admin'} OR class_name = ANY(${assignedClasses})
    ORDER BY child_full_name
  `) as unknown as BoardChild[];

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Family Board</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            {staff.role === 'teacher'
              ? `Children in your assigned classes${assignedClasses.length ? ` (${assignedClasses.join(', ')})` : ' — no classes assigned yet, ask an admin.'}.`
              : `${children.length} children across all statuses. Drag a card between columns to change status, or click a name for the full child card.`}
          </p>
        </div>
        <div className="flex items-start gap-3">
          {staff.role === 'admin' && (
            <Link
              href="/admin/families/new"
              className="whitespace-nowrap rounded-full bg-teal px-5 py-2 text-sm font-bold text-white hover:bg-teal-deep"
            >
              + Add Child
            </Link>
          )}
          <FamiliesTabs active="board" role={staff.role} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {STATUS_ORDER.map((status) => (
          <span key={status} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${STATUS_LEGEND[status].badgeClass}`}>
            <span className={`h-2 w-2 rounded-full ${STATUS_LEGEND[status].dotClass}`} />
            {STATUS_LEGEND[status].label}
          </span>
        ))}
      </div>

      <div className="mt-6">
        <FamilyBoard initialChildren={children} canEdit={staff.role === 'admin'} />
      </div>
    </section>
  );
}
