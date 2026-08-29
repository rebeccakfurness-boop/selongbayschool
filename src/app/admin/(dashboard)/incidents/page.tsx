import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, getAssignedClasses } from '@/lib/current-staff';
import { getIncidentReportsForStaff, getAllIncidentReports } from '@/lib/incident-reports';
import IncidentReportForm from '@/components/admin/IncidentReportForm';
import IncidentReportsManager from '@/components/admin/IncidentReportsManager';

export const dynamic = 'force-dynamic';

export default async function IncidentsPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const isAdmin = staff.role === 'admin';

  const classOptions =
    staff.role === 'teacher'
      ? await getAssignedClasses(staff.adminUserId)
      : ((await sql`SELECT DISTINCT class_name FROM children WHERE class_name IS NOT NULL ORDER BY class_name`) as unknown as { class_name: string }[]).map((r) => r.class_name);

  const childRows =
    classOptions.length === 0
      ? []
      : ((await sql`
          SELECT id, class_name, COALESCE(child_nickname, child_full_name) AS label FROM children
          WHERE class_name = ANY(${classOptions}) ORDER BY child_full_name
        `) as unknown as { id: number; class_name: string; label: string }[]);
  const childOptions = childRows.map((r) => ({ id: r.id, label: r.label, class_name: r.class_name }));

  const [ownReports, allReports] = await Promise.all([
    getIncidentReportsForStaff(staff.adminUserId),
    isAdmin ? getAllIncidentReports() : Promise.resolve([]),
  ]);

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Incident Reports</h1>
      <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
        Hazards, child-related incidents, first aid or injuries, and near misses. File a report as soon as you
        can — it goes straight to the school office.
      </p>
      <div className="mt-6">
        <IncidentReportForm childOptions={childOptions} initial={ownReports} />
      </div>

      {isAdmin && (
        <div className="mt-12">
          <h2 className="font-display text-xl font-semibold text-ink">All Reports (Office View)</h2>
          <p className="mt-1 text-sm text-ink-soft">Every incident report filed across the school, most urgent/unread first.</p>
          <div className="mt-4">
            <IncidentReportsManager initial={allReports} />
          </div>
        </div>
      )}
    </section>
  );
}
