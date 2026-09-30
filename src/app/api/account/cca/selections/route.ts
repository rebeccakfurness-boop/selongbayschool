import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { guardianOwnsChild } from '@/lib/lms-data';
import { submitCcaSelectionSchema } from '@/lib/validation';
import { getCcaSettings, submitCcaSelection } from '@/lib/cca';

/** Not covered by src/proxy.ts (matcher only lists /api/admin/:path* and /account/:path*, not
 * /api/account/:path*), same as the other /api/account/* routes -- the session is checked
 * directly. termLabel is always derived from the active cca_settings row server-side, never taken
 * from the client. */
export async function POST(req: NextRequest) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in to submit selections.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = submitCcaSelectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid selection.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    if (!(await guardianOwnsChild(session.customerId, d.childId))) {
      return NextResponse.json({ error: 'Not authorized for this child.' }, { status: 403 });
    }

    const settings = await getCcaSettings();
    if (!settings.selection_open) {
      return NextResponse.json({ error: 'CCA selections are currently closed.' }, { status: 409 });
    }

    const result = await submitCcaSelection(d.childId, settings.term_label, d.items);
    if ('error' in result) {
      const messages: Record<string, string> = {
        locked: 'This selection has already been invoiced and can no longer be changed.',
        selection_closed: 'CCA selections are currently closed.',
        invalid_item: 'One of the selected CCAs or options is no longer available.',
      };
      return NextResponse.json({ error: messages[result.error] }, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/account/cca/selections] failed to save', err);
    return NextResponse.json({ error: 'Could not save your selection.' }, { status: 500 });
  }
}
