import { requireAdmin } from '@/lib/current-staff';
import ImportFamilyDataForm from '@/components/admin/ImportFamilyDataForm';

export const dynamic = 'force-dynamic';

export default async function ImportDataPage() {
  await requireAdmin();

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Import Family Data</h1>
      <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
        Upload the enrollment/forecast spreadsheet directly: it populates the Family Board roster, the admissions
        pipeline, and the class forecast. Safe to re-run for the roster and forecast (never duplicates); check
        &quot;Clear existing admissions enquiries&quot; if you&apos;ve imported before.
      </p>
      <div className="mt-6">
        <ImportFamilyDataForm />
      </div>
    </section>
  );
}
