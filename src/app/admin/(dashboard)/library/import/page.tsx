import { requireAdmin } from '@/lib/current-staff';
import LibrarySubNav from '@/components/admin/LibrarySubNav';
import ImportLibraryItemsForm from '@/components/admin/ImportLibraryItemsForm';

export const dynamic = 'force-dynamic';

export default async function AdminLibraryImportPage() {
  await requireAdmin();

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Import Catalogue Items</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Bring in a whole Libib collection at once instead of adding items one by one.
      </p>
      <LibrarySubNav active="/admin/library/import" isAdmin={true} />

      <div className="mt-6">
        <ImportLibraryItemsForm />
      </div>
    </section>
  );
}
