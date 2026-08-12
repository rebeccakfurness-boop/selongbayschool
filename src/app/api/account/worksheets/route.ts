import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { guardianOwnsChild } from '@/lib/lms-data';
import {
  getWorksheetForOccurrenceChild,
  upsertWorksheetSubmission,
  getEffectiveFormatForChild,
  getClassNameForOccurrence,
} from '@/lib/worksheets';

/** Parent side of the worksheet flow: view their child's own submission/mark, and upload one for
 * an online session (per the agreed default — teacher handles on-site sessions instead). File
 * itself goes through the existing /api/account/children/[childId]/upload blob-token route
 * (kind=document, pathPrefix children/{childId}/); this route only ever records the resulting URL
 * against the right occurrence + child once guardianship and session eligibility are confirmed. */
export async function GET(req: NextRequest) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  }

  const occurrenceId = Number(req.nextUrl.searchParams.get('occurrenceId'));
  const childId = Number(req.nextUrl.searchParams.get('childId'));
  if (!Number.isInteger(occurrenceId) || !Number.isInteger(childId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    if (!(await guardianOwnsChild(session.customerId, childId))) {
      return NextResponse.json({ error: 'Not authorized for this child.' }, { status: 403 });
    }
    const detail = await getWorksheetForOccurrenceChild(occurrenceId, childId);
    return NextResponse.json({ worksheet: detail });
  } catch (err) {
    console.error('[api/account/worksheets] failed to load', err);
    return NextResponse.json({ error: 'Could not load worksheet.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  }

  let body: { occurrenceId?: number; childId?: number; fileUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const occurrenceId = Number(body.occurrenceId);
  const childId = Number(body.childId);
  const fileUrl = body.fileUrl;
  if (!Number.isInteger(occurrenceId) || !Number.isInteger(childId) || !fileUrl) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    if (!(await guardianOwnsChild(session.customerId, childId))) {
      return NextResponse.json({ error: 'Not authorized for this child.' }, { status: 403 });
    }
    const className = await getClassNameForOccurrence(occurrenceId);
    if (!className) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }
    const format = await getEffectiveFormatForChild(occurrenceId, childId);
    if (format !== 'online') {
      return NextResponse.json(
        { error: 'This session is in person — the teacher uploads the completed worksheet for on-site sessions.' },
        { status: 403 }
      );
    }

    const { id } = await upsertWorksheetSubmission({ occurrenceId, childId, fileUrl, actor: { customerId: session.customerId } });
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/account/worksheets] failed to save', err);
    return NextResponse.json({ error: 'Could not save worksheet.' }, { status: 500 });
  }
}
