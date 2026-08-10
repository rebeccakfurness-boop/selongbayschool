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
    // The @vercel/blob client SDK collapses any non-2xx response here into its own generic
    // "Failed to retrieve the client token" -- surfacing the real reason (a BlobError's message
    // is safe to show; it's never a stack trace or a secret) so whoever hits this next doesn't
    // have to go spelunking in Vercel's function logs to find out it was e.g. a missing
    // BLOB_READ_WRITE_TOKEN or an unsupported file type.
    const message = err instanceof Error ? err.message : 'Could not authorize upload.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
