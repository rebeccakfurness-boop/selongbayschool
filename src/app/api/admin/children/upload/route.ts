import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getCurrentStaff } from '@/lib/current-staff';

/** Separate from /api/admin/activities/upload: this one allows PDFs (passport/KITAS scans are
 * often PDF, not just photos) and is admin-only — these are immigration documents, more sensitive
 * than an activity photo, so teachers never get a token to upload or overwrite one. ?kind=avatar
 * (the child's profile photo) restricts to images at a smaller size cap; anything else (including
 * no kind param, for the existing passport/KITAS fields) keeps the original document allowance. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const staff = await getCurrentStaff();
  if (staff.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can upload family documents.' }, { status: 403 });
  }

  const isAvatar = request.nextUrl.searchParams.get('kind') === 'avatar';
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () =>
        isAvatar
          ? { allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'], maximumSizeInBytes: 5 * 1024 * 1024, addRandomSuffix: true }
          : { allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], maximumSizeInBytes: 15 * 1024 * 1024, addRandomSuffix: true },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error('[api/admin/children/upload] failed to authorize upload', err);
    return NextResponse.json({ error: 'Could not authorize upload.' }, { status: 400 });
  }
}
