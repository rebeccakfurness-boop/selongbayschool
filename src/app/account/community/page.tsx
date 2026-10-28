import Image from 'next/image';
import { ensureSchema } from '@/lib/db';
import { getCommunityPosts, type CommunityPost } from '@/lib/community';
import { formatDate } from '@/lib/admin-format';
import AccountNav from '@/components/account/AccountNav';

export const dynamic = 'force-dynamic';

function authorLabel(p: CommunityPost): string {
  return p.author_position_title || (p.author_role === 'admin' ? 'School Admin' : 'Teacher');
}

function CommunityLoadError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-ink">Community</h1>
      <div className="mt-6 rounded-md border border-orange-deep/40 bg-orange/10 p-5">
        <p className="font-semibold text-orange-deep">This page couldn&apos;t load.</p>
        <p className="mt-2 text-sm text-ink-soft">Please share this message with the school office so it can be fixed:</p>
        <pre className="mt-3 overflow-x-auto rounded-sm bg-ink/5 p-3 text-xs text-ink">{message}</pre>
      </div>
    </div>
  );
}

/** Read-only for parents -- a school-wide feed of updates from admin/staff/teachers, each
 * optionally carrying photos and/or an attached document (most often a newsletter). Separate
 * from the per-child Photo Feed under My Children, which stays scoped to one child. */
export default async function AccountCommunityPage() {
  try {
    await ensureSchema();
    const posts = await getCommunityPosts(50);
    return renderPage(posts);
  } catch (error) {
    console.error('[account/community] failed to load', error);
    return <CommunityLoadError error={error} />;
  }
}

function renderPage(posts: CommunityPost[]) {
  return (
    <div className="min-h-screen bg-cream">
      <AccountNav active="/account/community" />

      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Community</h1>
        <p className="mt-1 text-sm text-ink-soft">Updates, photos, and newsletters from the school.</p>

        {posts.length === 0 && (
          <div className="mt-8 rounded-md border border-dashed border-sand-line bg-paper p-8 text-center">
            <p className="text-ink-soft">No updates posted yet -- check back soon.</p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-5">
          {posts.map((p) => (
            <div key={p.id} className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {p.author_name} <span className="font-normal text-ink-soft">· {authorLabel(p)}</span>
                </p>
                <p className="text-xs text-ink-soft">{formatDate(p.created_at.slice(0, 10))}</p>
              </div>
              {p.title && <p className="mt-3 font-display text-lg font-semibold text-ink">{p.title}</p>}
              <p className="mt-1.5 whitespace-pre-line text-sm text-ink">{p.body}</p>

              {p.photos.length > 0 && (
                <div className={`mt-3 grid gap-2 ${p.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {p.photos.map((photo) => (
                    <a key={photo.id} href={photo.file_url} target="_blank" rel="noopener noreferrer" className="relative aspect-video overflow-hidden rounded-md border border-sand-line">
                      <Image src={photo.file_url} alt="" fill sizes="(max-width: 640px) 100vw, 600px" className="object-cover" />
                    </a>
                  ))}
                </div>
              )}

              {p.attachment_url && (
                <a
                  href={p.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 rounded-md border border-sand-line bg-cream px-4 py-3 text-sm font-semibold text-teal-deep underline"
                >
                  📎 {p.attachment_name || 'Download attachment'}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
