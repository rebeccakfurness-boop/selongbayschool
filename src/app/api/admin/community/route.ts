import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { createCommunityPostSchema } from '@/lib/validation';
import { getCommunityPosts, createCommunityPost } from '@/lib/community';

/** GET: the admin-side feed manager's own list (the parent portal reads straight from
 * getCommunityPosts in a server component instead -- it's read-only there, no need for a client
 * fetch). POST: any logged-in staff member can post, same "any staff" allowance as Family
 * Board/Teaching -- not admin-only. */
export async function GET() {
  await getCurrentStaff();
  try {
    await ensureSchema();
    const posts = await getCommunityPosts(100);
    return NextResponse.json({ posts });
  } catch (err) {
    console.error('[api/admin/community] failed to load', err);
    return NextResponse.json({ error: 'Could not load the feed.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();
  const body = await req.json().catch(() => null);
  const parsed = createCommunityPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid post.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const id = await createCommunityPost(staff.adminUserId, parsed.data);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/admin/community] failed to post', err);
    return NextResponse.json({ error: 'Could not publish that post.' }, { status: 500 });
  }
}
