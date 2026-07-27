import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { STATUS_LEGEND, STATUS_ORDER, CLASS_BAND_LABELS, type ChildStatus } from '@/lib/family-data';
import { formatDate } from '@/lib/admin-format';

export const dynamic = 'force-dynamic';

interface ChildRow {
  id: number;
  status: ChildStatus;
  is_active: boolean;
  class_name: string | null;
  class_band: string | null;
  child_full_name: string;
  child_nickname: string | null;
  parent1_name: string | null;
  parent2_name: string | null;
  allergies_medical_notes: string | null;
  enrolment_date: string | null;
  compliance_signed_count: number;
}

const COMPLIANCE_TOTAL = 7;

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
      (nisn_request_signed::int + liability_form_signed::int + photography_signed::int +
       pickup_authorization_signed::int + behavioral_form_signed::int +
       financial_agreement_signed::int + data_consent_signed::int) AS compliance_signed_count
    FROM children
    WHERE ${staff.role === 'admin'} OR class_name = ANY(${assignedClasses})
    ORDER BY child_full_name
  `) as unknown as ChildRow[];

  const byStatus = new Map<ChildStatus, ChildRow[]>(STATUS_ORDER.map((s) => [s, []]));
  for (const child of children) {
    byStatus.get(child.status)?.push(child);
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Family Board</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            {staff.role === 'teacher'
              ? `Children in your assigned classes${assignedClasses.length ? ` (${assignedClasses.join(', ')})` : ' — no classes assigned yet, ask an admin.'}.`
              : `${children.length} children across all statuses. Drag-and-drop between columns and the full child card land in Phase 2 — this is a read-only grouped view for now.`}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/admin/families/enquiries" className="rounded-full border border-sand-line bg-paper px-4 py-2 font-semibold text-ink hover:border-teal">
            Admissions pipeline
          </Link>
          {staff.role === 'admin' && (
            <Link href="/admin/families/forecast" className="rounded-full border border-sand-line bg-paper px-4 py-2 font-semibold text-ink hover:border-teal">
              Class forecast
            </Link>
          )}
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

      <div className="mt-6 grid gap-5 lg:grid-cols-3 xl:grid-cols-6">
        {STATUS_ORDER.map((status) => {
          const rows = byStatus.get(status) || [];
          return (
            <div key={status} className="flex min-w-[220px] flex-col gap-3 rounded-md border border-sand-line bg-sand/20 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">{STATUS_LEGEND[status].label}</span>
                <span className="text-xs font-bold text-ink-soft">{rows.length}</span>
              </div>
              {rows.map((child) => (
                <div key={child.id} className="rounded-md border border-sand-line bg-paper p-3 shadow-soft">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-display text-base font-semibold text-ink">
                        {child.child_nickname || child.child_full_name}
                      </div>
                      {child.child_nickname && <div className="text-xs text-ink-soft">{child.child_full_name}</div>}
                    </div>
                    {!child.is_active && (
                      <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink-soft">Inactive</span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-ink-soft">
                    {child.class_name || 'No class set'}
                    {child.class_band && ` · ${CLASS_BAND_LABELS[child.class_band as keyof typeof CLASS_BAND_LABELS] || child.class_band}`}
                  </div>
                  {(child.parent1_name || child.parent2_name) && (
                    <div className="mt-1 text-xs text-ink-soft">{[child.parent1_name, child.parent2_name].filter(Boolean).join(' & ')}</div>
                  )}
                  {child.allergies_medical_notes && (
                    <div className="mt-2 rounded-sm bg-orange/10 px-2 py-1 text-[11px] font-semibold text-orange-deep">
                      ⚠ Medical/allergy note on file
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-ink-soft">
                    <span>Compliance {child.compliance_signed_count}/{COMPLIANCE_TOTAL}</span>
                    {child.enrolment_date && <span>Enrolled {formatDate(child.enrolment_date)}</span>}
                  </div>
                </div>
              ))}
              {rows.length === 0 && <div className="rounded-md border border-dashed border-sand-line p-3 text-center text-xs text-ink-soft">No children</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
