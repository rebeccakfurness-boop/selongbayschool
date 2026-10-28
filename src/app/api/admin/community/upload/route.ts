import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getCurrentStaff } from '@/lib/current-staff';

/** Any logged-in staff member can post to the Community feed (admin or teacher -- same "any
 * staff" allowance as Family Board/Teaching), so this token endpoint doesn't gate by role, just
 * by being staff at all. Allows images for the feed's photos and PDFs for a newsletter/document
 * attachment. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  await getCurrentStaff();

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        maximumSizeInBytes: 15 * 1024 * 1024,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error('[api/admin/community/upload] failed to authorize upload', err);
    return NextResponse.json({ error: 'Could not authorize upload.' }, { status: 400 });
  }
}
