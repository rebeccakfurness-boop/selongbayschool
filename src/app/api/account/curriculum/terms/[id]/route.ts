import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { guardianOwnsChild } from '@/lib/lms-data';
import { getCurriculumTermTree, getProgressMapForChild } from '@/lib/curriculum';

/** Backs the parent's subject switcher on the Child Card — the server page only loads the first
 * programme's full tree up front; switching subjects fetches the rest on demand. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 403 });
  }

  const { id: idParam } = await params;
  const termId = Number(idParam);
  const childId = Number(req.nextUrl.searchParams.get('childId'));
  if (!Number.isInteger(termId) || !Number.isInteger(childId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    if (!(await guardianOwnsChild(session.customerId, childId))) {
      return NextResponse.json({ error: 'Not authorized for this child.' }, { status: 403 });
    }
    const term = await getCurriculumTermTree(termId);
    if (!term) {
      return NextResponse.json({ error: 'Programme not found.' }, { status: 404 });
    }
    const progressMap = await getProgressMapForChild(childId);
    return NextResponse.json({ term, progress: [...progressMap.entries()] });
  } catch (err) {
    console.error('[api/account/curriculum/terms/:id] failed to load', err);
    return NextResponse.json({ error: 'Could not load that subject.' }, { status: 500 });
  }
}
