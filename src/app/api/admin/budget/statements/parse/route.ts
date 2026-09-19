import { NextRequest, NextResponse } from 'next/server';
import { requireBudgetUnlocked } from '@/lib/current-staff';
import { parseBankStatementSchema } from '@/lib/validation';
import { statementFileTypeFromUrl, extractStatementText } from '@/lib/budget-statement-extract';
import { parseBankStatementText } from '@/lib/budget-statement-ai';

// Reading a whole statement + a Claude call with adaptive thinking can run well past the default
// serverless timeout — same reasoning as the Course Builder's own AI routes.
export const maxDuration = 300;

/** Every path below returns NextResponse.json — nothing is allowed to throw past this function.
 * An earlier version re-threw whatever requireBudgetUnlocked() raised beyond its one known
 * BUDGET_LOCKED case (e.g. an internal redirect, or any other unexpected error), which is an
 * uncaught exception escaping the route handler entirely -- exactly the shape of bug that
 * produces a raw, non-JSON 500 with no diagnosable error text on the client. */
export async function POST(req: NextRequest) {
  try {
    try {
      await requireBudgetUnlocked();
    } catch (err) {
      if (err instanceof Error && err.message === 'BUDGET_LOCKED') {
        return NextResponse.json({ error: 'Budget Tracker is locked.' }, { status: 403 });
      }
      console.error('[api/admin/budget/statements/parse] requireBudgetUnlocked failed', err);
      return NextResponse.json({ error: `Could not verify access: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
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

    console.log(`[api/admin/budget/statements/parse] extracting text (${fileType}) from ${parsed.data.fileUrl}`);
    const text = await extractStatementText(parsed.data.fileUrl, fileType);
    console.log(`[api/admin/budget/statements/parse] extracted ${text.length} chars, calling Claude`);
    const statement = await parseBankStatementText(text);
    console.log(`[api/admin/budget/statements/parse] parsed ${statement.transactions.length} transaction(s)`);
    return NextResponse.json(statement);
  } catch (err) {
    console.error('[api/admin/budget/statements/parse] failed', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Could not read this statement: ${message}` }, { status: 500 });
  }
}
