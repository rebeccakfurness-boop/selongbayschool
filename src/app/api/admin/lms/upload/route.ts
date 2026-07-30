import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getCurrentStaff } from '@/lib/current-staff';

/** Shared upload endpoint for work samples, photo feed items, and resources — unlike
 * /api/admin/children/upload (immigration documents, admin-only), teachers need this one too:
 * they upload work samples and photos directly per the LMS brief. */
export async function POST(request: Request): Promise<NextResponse> {
  await getCurrentStaff(); // any logged-in staff (admin or teacher); proxy already requires a session

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
        maximumSizeInBytes: 15 * 1024 * 1024,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error('[api/admin/lms/upload] failed to authorize upload', err);
    return NextResponse.json({ error: 'Could not authorize upload.' }, { status: 400 });
  }
}
