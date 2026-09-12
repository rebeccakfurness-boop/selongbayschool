import { notFound } from 'next/navigation';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import LibrarySubNav from '@/components/admin/LibrarySubNav';
import EditLibraryItemForm, { type EditableLibraryItem } from '@/components/admin/EditLibraryItemForm';

export const dynamic = 'force-dynamic';

export default async function EditLibraryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireAdmin();
  await ensureSchema();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const rows = (await sql`
    SELECT id, item_type, title, author, category, item_code, description, photo_url,
      age_group, tags, school_only, total_copies, is_active
    FROM library_items WHERE id = ${id}
  `) as unknown as EditableLibraryItem[];
  const item = rows[0];
  if (!item) notFound();

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Edit Catalogue Item</h1>
      <LibrarySubNav active="/admin/library" isAdmin={staff.role === 'admin'} />

      <div className="mt-6 max-w-2xl">
        <EditLibraryItemForm item={item} />
      </div>
    </section>
  );
}
