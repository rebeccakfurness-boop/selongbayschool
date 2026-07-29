import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { STATUS_LEGEND, STATUS_ORDER } from '@/lib/family-data';
import { COMPLIANCE_STALE_AFTER_DAYS } from '@/lib/child-lifecycle';
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
      c.id, c.status, c.is_active, c.class_name, c.class_band, c.child_full_name, c.child_nickname, c.photo_url,
      c.parent1_name, c.parent2_name, c.allergies_medical_notes, c.enrolment_date, c.programme,
      (c.liability_form_signed::int + c.photography_signed::int + c.pickup_authorization_signed::int +
       c.behavioral_form_signed::int + c.financial_agreement_signed::int +
       c.parent_protection_addendum_signed::int + c.data_consent_signed::int) AS compliance_signed_count,
      (
        (c.liability_form_signed AND c.liability_form_date < CURRENT_DATE - ${COMPLIANCE_STALE_AFTER_DAYS}) OR
        (c.photography_signed AND c.photography_form_date < CURRENT_DATE - ${COMPLIANCE_STALE_AFTER_DAYS}) OR
        (c.pickup_authorization_signed AND c.pickup_form_date < CURRENT_DATE - ${COMPLIANCE_STALE_AFTER_DAYS}) OR
        (c.behavioral_form_signed AND c.behavioral_form_date < CURRENT_DATE - ${COMPLIANCE_STALE_AFTER_DAYS}) OR
        (c.financial_agreement_signed AND c.financial_agreement_date < CURRENT_DATE - ${COMPLIANCE_STALE_AFTER_DAYS})
      ) AS compliance_out_of_date,
      latest_inv.status AS latest_invoice_status,
      GREATEST(0, (CURRENT_DATE - latest_inv.due_date))::int AS latest_invoice_days_overdue
    FROM children c
    LEFT JOIN LATERAL (
      SELECT i.status, i.due_date
      FROM invoices i
      JOIN invoice_children ic ON ic.invoice_id = i.id
      WHERE ic.child_id = c.id AND i.invoice_type = 'tuition' AND i.status <> 'cancelled'
      ORDER BY i.issue_date DESC, i.id DESC
      LIMIT 1
    ) latest_inv ON true
    WHERE ${staff.role === 'admin'} OR c.class_name = ANY(${assignedClasses})
    ORDER BY c.child_full_name
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
        <span className="inline-flex items-center gap-2 rounded-full bg-ink/10 px-3 py-1 text-xs font-bold text-ink-soft">
          <span className="h-2 w-2 rounded-full bg-ink-soft" />
          Inactive
        </span>
      </div>

      <div className="mt-6">
        <FamilyBoard initialChildren={children} canEdit={staff.role === 'admin'} />
      </div>
    </section>
  );
}
