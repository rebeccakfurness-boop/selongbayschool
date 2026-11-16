import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

/** Photo uploads for a weekly session entry -- proxy.ts already requires a Serangan session for
 * every /api/serangan/* path, so no separate auth check is needed here. Mirrors the admin
 * Community feed's photo upload token endpoint, images only. */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maximumSizeInBytes: 15 * 1024 * 1024,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error('[api/serangan/entries/upload] failed to authorize upload', err);
    const message = err instanceof Error ? err.message : 'Could not authorize upload.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
