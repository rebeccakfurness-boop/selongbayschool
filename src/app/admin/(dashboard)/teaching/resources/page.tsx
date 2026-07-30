import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import TeachingTabs from '@/components/admin/TeachingTabs';
import ResourcesManager, { type Resource } from '@/components/admin/ResourcesManager';

export const dynamic = 'force-dynamic';

export default async function ResourcesPage() {
  await ensureSchema();
  await getCurrentStaff();

  const resources = (await sql`
    SELECT id, title, description, file_url, class_band FROM resources ORDER BY created_at DESC
  `) as unknown as Resource[];

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Teaching</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            Downloadable resources for the parent and student portals.
          </p>
        </div>
        <TeachingTabs active="resources" />
      </div>
      <div className="mt-6">
        <ResourcesManager initial={resources} />
      </div>
    </section>
  );
}
