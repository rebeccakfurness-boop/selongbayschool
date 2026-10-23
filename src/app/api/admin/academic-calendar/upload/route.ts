import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireAdmin } from '@/lib/current-staff';

/** Upload endpoint for the Academic Calendar PDF embedded on the public How It Works page --
 * admin-only (unlike /api/admin/library/upload, which any staff can reach), since replacing the
 * school-wide calendar isn't a day-to-day teaching-staff action. */
export async function POST(request: Request): Promise<NextResponse> {
  await requireAdmin();

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['application/pdf'],
        maximumSizeInBytes: 20 * 1024 * 1024,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error('[api/admin/academic-calendar/upload] failed to authorize upload', err);
    const message = err instanceof Error ? err.message : 'Could not authorize upload.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
