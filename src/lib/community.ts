import { sql } from './db';
import type { CreateCommunityPostInput } from './validation';

export interface CommunityPostPhoto {
  id: number;
  file_url: string;
}

export interface CommunityPost {
  id: number;
  author_admin_user_id: number;
  author_name: string;
  author_role: 'admin' | 'teacher';
  author_position_title: string | null;
  title: string | null;
  body: string;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
  photos: CommunityPostPhoto[];
}

/** Schoolwide, newest first -- no audience targeting (see the schema comment on community_posts
 * in lib/db.ts for why). Photos are fetched in a second query keyed off the first page's post
 * ids rather than a join, so a post with many photos doesn't fan out and duplicate the post row
 * per photo. */
export async function getCommunityPosts(limit: number): Promise<CommunityPost[]> {
  const posts = (await sql`
    SELECT p.id, p.author_admin_user_id, COALESCE(u.display_name, u.email) AS author_name, u.role AS author_role,
      u.position_title AS author_position_title, p.title, p.body, p.attachment_url, p.attachment_name, p.created_at::text
    FROM community_posts p
    JOIN admin_users u ON u.id = p.author_admin_user_id
    ORDER BY p.created_at DESC
    LIMIT ${limit}
  `) as unknown as Omit<CommunityPost, 'photos'>[];

  if (posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);
  const photoRows = (await sql`
    SELECT id, post_id, file_url FROM community_post_photos
    WHERE post_id = ANY(${postIds})
    ORDER BY post_id, sort_order, id
  `) as unknown as { id: number; post_id: number; file_url: string }[];

  const photosByPost = new Map<number, CommunityPostPhoto[]>();
  for (const row of photoRows) {
    const list = photosByPost.get(row.post_id) ?? [];
    list.push({ id: row.id, file_url: row.file_url });
    photosByPost.set(row.post_id, list);
  }

  return posts.map((p) => ({ ...p, photos: photosByPost.get(p.id) ?? [] }));
}

export async function createCommunityPost(authorAdminUserId: number, input: CreateCommunityPostInput): Promise<number> {
  const rows = (await sql`
    INSERT INTO community_posts (author_admin_user_id, title, body, attachment_url, attachment_name)
    VALUES (${authorAdminUserId}, ${input.title || null}, ${input.body}, ${input.attachmentUrl || null}, ${input.attachmentName || null})
    RETURNING id
  `) as unknown as { id: number }[];
  const postId = rows[0].id;

  if (input.photoUrls.length > 0) {
    for (let i = 0; i < input.photoUrls.length; i++) {
      await sql`INSERT INTO community_post_photos (post_id, file_url, sort_order) VALUES (${postId}, ${input.photoUrls[i]}, ${i})`;
    }
  }

  return postId;
}

export async function getCommunityPostAuthor(id: number): Promise<number | null> {
  const rows = (await sql`SELECT author_admin_user_id FROM community_posts WHERE id = ${id}`) as unknown as { author_admin_user_id: number }[];
  return rows[0]?.author_admin_user_id ?? null;
}

export async function deleteCommunityPost(id: number): Promise<void> {
  await sql`DELETE FROM community_posts WHERE id = ${id}`;
}
