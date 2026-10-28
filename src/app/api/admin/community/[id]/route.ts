import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { getCommunityPostAuthor, deleteCommunityPost } from '@/lib/community';

/** A staff member can remove their own post; an admin can remove anyone's (same override every
 * other "own content, admin can override" action in this app gives). */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid post id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const authorId = await getCommunityPostAuthor(id);
    if (authorId === null) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }
    const isAuthor = String(authorId) === String(staff.adminUserId);
    if (!isAuthor && staff.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
    }

    await deleteCommunityPost(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/community/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not remove that post.' }, { status: 500 });
  }
}
