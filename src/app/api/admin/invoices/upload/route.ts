import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireAdmin } from '@/lib/current-staff';

/** Proof-of-payment photo upload for invoices — admin-only, matching InvoicesSection's own
 * canEdit gating (invoice editing generally is admin-only, unlike e.g. work samples/photos which
 * teachers can also add). */
export async function POST(request: Request): Promise<NextResponse> {
  await requireAdmin();

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
    console.error('[api/admin/invoices/upload] failed to authorize upload', err);
    const message = err instanceof Error ? err.message : 'Could not authorize upload.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
