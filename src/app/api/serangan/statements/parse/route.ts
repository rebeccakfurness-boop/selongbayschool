import { NextRequest, NextResponse } from 'next/server';
import { requireSeranganAdminApi } from '@/lib/current-serangan';
import { seranganParseBankStatementSchema } from '@/lib/validation';
import { statementFileTypeFromUrl, extractStatementText } from '@/lib/budget-statement-extract';
import { parseBankStatementText } from '@/lib/budget-statement-ai';

// Reading a whole statement + an AI transcription call can run well past the default serverless
// timeout -- same reasoning as the admin Budget Tracker's own statement-parsing route, which this
// one otherwise mirrors exactly (the extraction/parsing code is shared; only the auth model and
// what the reviewed rows get written into differ).
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    await requireSeranganAdminApi();
  } catch {
    return NextResponse.json({ error: 'Not authorized to read bank statements.' }, { status: 403 });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const parsed = seranganParseBankStatementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
    }

    const fileType = statementFileTypeFromUrl(parsed.data.fileUrl);
    if (!fileType) {
      return NextResponse.json({ error: 'Could not tell what kind of file this is — expected .pdf, .csv, or .xlsx.' }, { status: 400 });
    }

    const text = await extractStatementText(parsed.data.fileUrl, fileType);
    const statement = await parseBankStatementText(text);
    return NextResponse.json(statement);
  } catch (err) {
    console.error('[api/serangan/statements/parse] failed', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Could not read this statement: ${message}` }, { status: 500 });
  }
}
