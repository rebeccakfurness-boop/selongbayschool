import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getStudentSessionOptions, type StudentSessionData } from '@/lib/auth';

/** Blob upload token route for the student role — didn't exist before this (students previously
 * had nothing to upload). Scoped to the logged-in student's own childId folder, same pattern as
 * /api/account/children/[childId]/upload for parents; the actual worksheet metadata is recorded
 * separately by /api/student/worksheets after this. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getIronSession<StudentSessionData>(await cookies(), await getStudentSessionOptions());
  if (!session.childId) {
    return NextResponse.json({ error: 'Please log in to upload files.' }, { status: 401 });
  }

  const pathPrefix = `children/${session.childId}/worksheets/`;
  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(pathPrefix)) {
          throw new Error('Upload path not allowed.');
        }
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
          maximumSizeInBytes: 15 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error('[api/student/upload] failed to authorize upload', err);
    const message = err instanceof Error ? err.message : 'Could not authorize upload.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
