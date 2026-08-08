import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireBudgetUnlocked } from '@/lib/current-staff';

/** Upload endpoint for revenue/expense receipt photos — same @vercel/blob client-upload pattern
 * as the LMS/activities uploads, gated by the Budget Tracker's own password on top of admin
 * login (requireBudgetUnlocked), not just admin login alone. */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireBudgetUnlocked();
  } catch (err) {
    if (err instanceof Error && err.message === 'BUDGET_LOCKED') {
      return NextResponse.json({ error: 'Budget Tracker is locked.' }, { status: 403 });
    }
    throw err;
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
        maximumSizeInBytes: 15 * 1024 * 1024,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error('[api/admin/budget/upload] failed to authorize upload', err);
    return NextResponse.json({ error: 'Could not authorize upload.' }, { status: 400 });
  }
}
