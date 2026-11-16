import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireSeranganAdminApi } from '@/lib/current-serangan';

/** Bank/Wise statement upload for the Serangan dashboard's statement import -- a 'staff' account
 * must never see bank statements, so this is gated to 'admin' on top of proxy.ts's plain "is a
 * logged-in Serangan session" check. Statement files live under their own blob path prefix (see
 * the client's upload call in SeranganStatementImportReview.tsx) so they're easy to tell apart
 * from anything else. */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireSeranganAdminApi();
  } catch {
    return NextResponse.json({ error: 'Not authorized to import bank statements.' }, { status: 403 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'application/pdf',
          'text/csv',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        maximumSizeInBytes: 20 * 1024 * 1024,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error('[api/serangan/statements/upload] failed to authorize upload', err);
    const message = err instanceof Error ? err.message : 'Could not authorize upload.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
