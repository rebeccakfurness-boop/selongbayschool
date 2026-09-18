import { NextRequest, NextResponse } from 'next/server';
import { requireBudgetUnlocked } from '@/lib/current-staff';
import { parseBankStatementSchema } from '@/lib/validation';
import { statementFileTypeFromUrl, extractStatementText } from '@/lib/budget-statement-extract';
import { parseBankStatementText } from '@/lib/budget-statement-ai';

// Reading a whole statement + a Claude call with adaptive thinking can run well past the default
// serverless timeout — same reasoning as the Course Builder's own AI routes.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    await requireBudgetUnlocked();
  } catch (err) {
    if (err instanceof Error && err.message === 'BUDGET_LOCKED') {
      return NextResponse.json({ error: 'Budget Tracker is locked.' }, { status: 403 });
    }
    throw err;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = parseBankStatementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
  }

  const fileType = statementFileTypeFromUrl(parsed.data.fileUrl);
  if (!fileType) {
    return NextResponse.json({ error: 'Could not tell what kind of file this is — expected .pdf, .csv, or .xlsx.' }, { status: 400 });
  }

  try {
    const text = await extractStatementText(parsed.data.fileUrl, fileType);
    const statement = await parseBankStatementText(text);
    return NextResponse.json(statement);
  } catch (err) {
    console.error('[api/admin/budget/statements/parse] failed', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not read this statement.' }, { status: 500 });
  }
}
