import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';

/** Any logged-in parent can attach photos when filing a "Report a concern" submission -- same
 * "any logged-in customer" allowance as the submission route itself (POST /api/account/feedback). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in to upload a photo.' }, { status: 401 });
  }

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
    console.error('[api/account/feedback/upload] failed to authorize upload', err);
    return NextResponse.json({ error: 'Could not authorize upload.' }, { status: 400 });
  }
}
