import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getCurrentStaff } from '@/lib/current-staff';

/** Mirrors /api/admin/children/upload for staff documents (CV, contract, passport/KITAS scan,
 * professional-development certificates, payslip PDFs) -- admin-only, since every one of these is
 * an HR document. ?kind=avatar restricts to images at a smaller size cap for a profile photo;
 * anything else keeps the full document allowance (images + PDF). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const staff = await getCurrentStaff();
  if (staff.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can upload staff documents.' }, { status: 403 });
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
    console.error('[api/admin/staff/upload] failed to authorize upload', err);
    return NextResponse.json({ error: 'Could not authorize upload.' }, { status: 400 });
  }
}
