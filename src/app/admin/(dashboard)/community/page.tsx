import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { getCommunityPosts } from '@/lib/community';
import CommunityFeedManager from '@/components/admin/CommunityFeedManager';

export const dynamic = 'force-dynamic';

/** Any staff member (admin or teacher) can post here -- same "any staff" allowance as Family
 * Board/Teaching, not gated to admin-only. */
export default async function AdminCommunityPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const posts = await getCommunityPosts(100);

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Community Feed</h1>
      <p className="mt-1 text-sm text-ink-soft">Post school-wide updates, photos, and documents (like newsletters) straight to every family&apos;s parent portal.</p>
      <div className="mt-6">
        <CommunityFeedManager initial={posts} currentAdminUserId={staff.adminUserId} isAdmin={staff.role === 'admin'} />
      </div>
    </section>
  );
}
