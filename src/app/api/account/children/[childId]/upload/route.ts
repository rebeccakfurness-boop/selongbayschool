import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { ensureSchema } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { guardianOwnsChild } from '@/lib/lms-data';

/** Mirrors /api/admin/children/upload, but scoped to the requesting parent's own child: ownership
 * is checked once up front (guardianOwnsChild) and the pathname is checked again inside
 * onBeforeGenerateToken so a client can't point the same authorized request at a different child's
 * folder. ?kind=avatar restricts to images and a smaller size cap (it's just a profile photo);
 * ?kind=document (passport/KITAS/birth certificate) allows PDFs too, matching the admin route's
 * allowance for scanned documents. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ childId: string }> }): Promise<NextResponse> {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in to upload files.' }, { status: 401 });
  }

  const { childId: idParam } = await params;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) {
    return NextResponse.json({ error: 'Invalid child id.' }, { status: 400 });
  }

  await ensureSchema();
  if (!(await guardianOwnsChild(session.customerId, childId))) {
    return NextResponse.json({ error: 'Not authorized to upload files for this child.' }, { status: 403 });
  }

  const kind = req.nextUrl.searchParams.get('kind') === 'document' ? 'document' : 'avatar';
  const pathPrefix = `children/${childId}/`;

  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(pathPrefix)) {
          throw new Error('Upload path not allowed.');
        }
        return kind === 'document'
          ? { allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], maximumSizeInBytes: 15 * 1024 * 1024, addRandomSuffix: true }
          : { allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'], maximumSizeInBytes: 5 * 1024 * 1024, addRandomSuffix: true };
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error('[api/account/children/:childId/upload] failed to authorize upload', err);
    return NextResponse.json({ error: 'Could not authorize upload.' }, { status: 400 });
  }
}
