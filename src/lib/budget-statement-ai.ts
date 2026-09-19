/** Gemini's free tier (aistudio.google.com -- no credit card required) rather than a paid
 * Anthropic key, per an explicit cost decision: this feature only ever does one thing (literal
 * transcription of a statement's transactions into structured JSON), which a free-tier model
 * handles fine, so there's no reason to require a paid API key for it. gemini-2.5-flash is the
 * model AI Studio's free tier documents as available at that tier -- swap MODEL below if Google
 * changes which models are free. */
const MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface ParsedStatementTransaction {
  date: string;
  description: string;
  amount: number;
  direction: 'credit' | 'debit';
  counterparty: string;
}

export interface ParsedBankStatement {
  accountLabel: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  openingBalance?: number;
  closingBalance?: number;
  transactions: ParsedStatementTransaction[];
}

// Gemini's responseSchema is a subset of the OpenAPI 3.0 schema object -- uppercase type names,
// no additionalProperties support -- not the same JSON Schema dialect Anthropic's tool_choice
// takes, so this isn't a drop-in reuse of the old PARSE_STATEMENT_SCHEMA.
const TRANSACTION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    date: { type: 'STRING', description: 'ISO date, YYYY-MM-DD' },
    description: { type: 'STRING', description: "The transaction's own remark/description text, as close to verbatim as the source allows" },
    amount: { type: 'NUMBER', description: 'Always positive — direction carries the sign' },
    direction: { type: 'STRING', enum: ['credit', 'debit'], description: 'credit = money in, debit = money out' },
    counterparty: {
      type: 'STRING',
      description: 'The person, company, or bank this is from/to, if identifiable from the description — empty string if not identifiable',
    },
  },
  required: ['date', 'description', 'amount', 'direction', 'counterparty'],
};

const PARSE_STATEMENT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    accountLabel: { type: 'STRING', description: 'Bank/account name or number as shown on the statement' },
    currency: { type: 'STRING', description: 'ISO currency code shown on the statement, e.g. IDR, NZD, USD' },
    periodStart: { type: 'STRING', description: 'ISO date, or empty string if not shown' },
    periodEnd: { type: 'STRING', description: 'ISO date, or empty string if not shown' },
    openingBalance: { type: 'NUMBER', description: 'Omit this field entirely if no opening balance is shown on the statement' },
    closingBalance: { type: 'NUMBER', description: 'Omit this field entirely if no closing balance is shown on the statement' },
    transactions: { type: 'ARRAY', items: TRANSACTION_SCHEMA, description: 'Every transaction line in the statement, in the order they appear' },
  },
  required: ['accountLabel', 'currency', 'transactions'],
};

interface GeminiCandidate {
  content?: { parts?: { text?: string }[] };
  finishReason?: string;
}
interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
}

/** Extracts every transaction from a bank/Wise statement's raw text (already pulled out of a PDF
 * via pdf-extract.ts, or out of a CSV/XLSX via xlsx's sheet_to_csv — this function doesn't care
 * which, since by this point it's just text) — literal transcription only, never a
 * revenue-vs-expense or budget-category judgment call. That classification stays a human step in
 * the review table this feeds (StatementImportReview.tsx): this session's own experience reading
 * real statements by hand found genuine mixed-personal-and-school accounts and ambiguous
 * transfers that no automated categorization could have caught safely, so nothing here writes to
 * the database or is treated as final without an admin reviewing every row first. */
export async function parseBankStatementText(statementText: string): Promise<ParsedBankStatement> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing — get a free key at aistudio.google.com and add it in the Vercel project settings.');
  }

  // Defends against a pathologically long extracted text (a many-page statement, or a CSV/XLSX
  // export with far more rows than a bank statement realistically has) blowing out the request
  // size or run time in a way that could crash the function rather than fail cleanly. ~200k chars
  // is generous headroom over anything a real bank/Wise statement has produced this session.
  const MAX_STATEMENT_CHARS = 200_000;
  const truncated = statementText.length > MAX_STATEMENT_CHARS;
  const textForPrompt = truncated ? statementText.slice(0, MAX_STATEMENT_CHARS) : statementText;

  const systemInstruction =
    'You are transcribing a bank or payment-provider statement into structured data. Extract every transaction line ' +
    'exactly as it appears — do not summarize, merge, skip, or invent transactions, and do not guess what a transaction ' +
    'is "for" beyond what the statement itself states. Preserve the statement’s own transaction order.' +
    (truncated ? ' The text below was truncated for length -- transcribe whatever transactions are present in it.' : '');

  let response: Response;
  try {
    response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `Extract every transaction from this bank statement text:\n\n${textForPrompt}` }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: PARSE_STATEMENT_SCHEMA,
        },
      }),
    });
  } catch (err) {
    throw new Error(`Could not reach the Gemini API: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error?.message || `HTTP ${response.status}`;
    if (response.status === 400 && /API key/i.test(message)) {
      throw new Error('Gemini API key is missing or invalid (check GEMINI_API_KEY in the Vercel project settings).');
    }
    if (response.status === 429) {
      throw new Error('Gemini API rate limit hit (the free tier has a per-minute cap) — try again shortly.');
    }
    throw new Error(`Gemini API error (${response.status}): ${message}`);
  }

  const data = (await response.json()) as GeminiResponse;
  if (data.promptFeedback?.blockReason) {
    throw new Error(`Gemini declined to process this statement (${data.promptFeedback.blockReason}).`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Gemini did not return parsed transactions (finish reason: ${data.candidates?.[0]?.finishReason ?? 'unknown'}).`);
  }

  let result: ParsedBankStatement;
  try {
    result = JSON.parse(text) as ParsedBankStatement;
  } catch {
    throw new Error('Gemini returned malformed JSON for this statement — try again, or a shorter/clearer file.');
  }

  if (result.transactions.length === 0) {
    throw new Error('No transactions were found in this statement — check the file uploaded correctly.');
  }
  return result;
}
