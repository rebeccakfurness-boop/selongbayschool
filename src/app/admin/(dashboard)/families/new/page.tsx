import { requireAdmin } from '@/lib/current-staff';
import NewChildForm from '@/components/admin/NewChildForm';

export const dynamic = 'force-dynamic';

export default async function NewChildPage() {
  await requireAdmin();

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Add a Child</h1>
      <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
        For a family that isn&apos;t in the imported spreadsheet, or wasn&apos;t captured there.
      </p>
      <div className="mt-6">
        <NewChildForm />
      </div>
    </section>
  );
}
