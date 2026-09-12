import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { getLibraryItems } from '@/lib/library';
import LibrarySubNav from '@/components/admin/LibrarySubNav';
import AddLibraryItemForm from '@/components/admin/AddLibraryItemForm';
import LibraryItemActions from '@/components/admin/LibraryItemActions';
import LibraryItemPhotoCell from '@/components/admin/LibraryItemPhotoCell';

export const dynamic = 'force-dynamic';

const ITEM_TYPE_LABELS: Record<string, string> = {
  book: 'Book',
  toy: 'Toy',
  sports_equipment: 'Sports equipment',
  other: 'Other',
};

export default async function AdminLibraryCataloguePage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const { q, type } = await searchParams;
  const items = await getLibraryItems({ q, type });
  const childOptions = ((await sql`
    SELECT id, COALESCE(child_nickname, child_full_name) AS label FROM children WHERE is_active = true ORDER BY child_full_name
  `) as unknown as { id: number; label: string }[]).map((c) => ({ id: c.id, label: c.label }));

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Library</h1>
      <p className="mt-1 text-sm text-ink-soft">{items.length} items in the catalogue — books, toys and sports equipment.</p>
      <LibrarySubNav active="/admin/library" isAdmin={staff.role === 'admin'} />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <AddLibraryItemForm />
        <form className="flex flex-wrap gap-2" action="/admin/library">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search title, author, category, tags…"
            className="min-w-[220px] rounded-sm border border-sand-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50"
          />
          <select name="type" defaultValue={type ?? ''} className="rounded-sm border border-sand-line bg-white px-3 py-2 text-sm text-ink">
            <option value="">All types</option>
            <option value="book">Books</option>
            <option value="toy">Toys</option>
            <option value="sports_equipment">Sports equipment</option>
            <option value="other">Other</option>
          </select>
          <button type="submit" className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal-deep">
            Search
          </button>
          {(q || type) && (
            <Link href="/admin/library" className="self-center text-sm font-semibold text-ink-soft underline">
              Clear
            </Link>
          )}
        </form>
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
        <table className="w-full min-w-[1080px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">Photo</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Item</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Type</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Category / Age / Tags</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Copies</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Status</th>
              <th className="px-4 py-3 font-bold text-ink-soft"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const available = item.available_copies > 0;
              return (
                <tr key={item.id} className="border-b border-sand-line/60 last:border-0 align-top">
                  <td className="px-4 py-3">
                    <LibraryItemPhotoCell itemId={item.id} photoUrl={item.photo_url} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/library/${item.id}/edit`} className="font-semibold text-teal-deep hover:underline">
                      {item.title}
                    </Link>
                    {item.author && <div className="text-xs text-ink-soft">{item.author}</div>}
                    {item.item_code && <div className="text-xs text-ink-soft">Code: {item.item_code}</div>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{ITEM_TYPE_LABELS[item.item_type]}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    <div>{item.category || '—'}</div>
                    {item.age_group && <div className="text-xs">Age: {item.age_group}</div>}
                    {item.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-aqua/50 px-2 py-0.5 text-xs font-semibold text-teal-deep">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                    {item.available_copies} / {item.total_copies} available
                    {item.copies_held > 0 && <div className="text-xs">({item.copies_held} held for pickup)</div>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        item.is_active ? 'bg-teal/15 text-teal-deep' : 'bg-black/10 text-ink-soft'
                      }`}
                    >
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {item.school_only && (
                      <span className="ml-1 rounded-full bg-orange/20 px-2 py-0.5 text-xs font-bold text-orange-deep">School only</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <LibraryItemActions itemId={item.id} isActive={item.is_active} available={available} schoolOnly={item.school_only} childOptions={childOptions} />
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">No items match this search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
