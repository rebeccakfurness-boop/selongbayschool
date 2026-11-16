import { ensureSchema } from '@/lib/db';
import { getRecentEntries } from '@/lib/serangan';
import SeranganNav from '@/components/serangan/SeranganNav';
import SeranganEntriesManager from '@/components/serangan/SeranganEntriesManager';

export const dynamic = 'force-dynamic';

export default async function SeranganEntriesPage() {
  await ensureSchema();
  const entries = await getRecentEntries(200);

  return (
    <div className="min-h-screen bg-cream">
      <SeranganNav active="/serangan/entries" />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Weekly Entries</h1>
        <p className="mt-1 text-sm text-ink-soft">One entry per session -- date, activity, who was there, and how many local children attended.</p>
        <div className="mt-6">
          <SeranganEntriesManager initial={entries} />
        </div>
      </div>
    </div>
  );
}
