import { ensureSchema } from '@/lib/db';
import { requireSeranganAdmin } from '@/lib/current-serangan';
import { getAllSeranganUsers } from '@/lib/serangan';
import SeranganNav from '@/components/serangan/SeranganNav';
import SeranganUsersManager from '@/components/serangan/SeranganUsersManager';

export const dynamic = 'force-dynamic';

export default async function SeranganUsersPage() {
  const admin = await requireSeranganAdmin();
  await ensureSchema();
  const users = await getAllSeranganUsers();

  return (
    <div className="min-h-screen bg-cream">
      <SeranganNav active="/serangan/users" role={admin.role} />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Manage Users</h1>
        <p className="mt-1 text-sm text-ink-soft">Add other Serangan dashboard logins, or deactivate one that no longer needs access.</p>
        <div className="mt-6">
          <SeranganUsersManager initial={users} currentUserId={admin.seranganAdminId} />
        </div>
      </div>
    </div>
  );
}
