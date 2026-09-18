import Anthropic from '@anthropic-ai/sdk';

/** claude-sonnet-5 — matches curriculum-generation/anthropic-provider.ts's own choice and
 * reasoning (cost-driven, human-requested); this file mirrors that provider's
 * callForStructuredOutput/explainAnthropicError shape directly rather than importing it, since the
 * two are otherwise unrelated domains (curriculum content vs. bank statement transactions) and
 * duplicating ~30 lines is cheaper than coupling them. */
const MODEL = 'claude-sonnet-5';

function getClient(): Anthropic {
  return new Anthropic();
}

function explainAnthropicError(err: unknown): Error {
  if (err instanceof Anthropic.AuthenticationError) {
    return new Error('Anthropic API key is missing or invalid (check ANTHROPIC_API_KEY in the Vercel project settings).');
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new Error('Anthropic API rate limit hit — try again shortly.');
  }
  if (err instanceof Anthropic.APIError) {
    return new Error(`Anthropic API error (${err.status}): ${err.message}`);
  }
  return err instanceof Error ? err : new Error(String(err));
}

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
  openingBalance: number | null;
  closingBalance: number | null;
  transactions: ParsedStatementTransaction[];
}

const TRANSACTION_SCHEMA = {
  type: 'object',
  properties: {
    date: { type: 'string', description: 'ISO date, YYYY-MM-DD' },
    description: { type: 'string', description: "The transaction's own remark/description text, as close to verbatim as the source allows" },
    amount: { type: 'number', description: 'Always positive — direction carries the sign' },
    direction: { type: 'string', enum: ['credit', 'debit'], description: 'credit = money in, debit = money out' },
    counterparty: {
      type: 'string',
      description: 'The person, company, or bank this is from/to, if identifiable from the description — empty string if not identifiable',
    },
  },
  required: ['date', 'description', 'amount', 'direction', 'counterparty'],
  additionalProperties: false,
};

const PARSE_STATEMENT_SCHEMA = {
  type: 'object',
  properties: {
    accountLabel: { type: 'string', description: 'Bank/account name or number as shown on the statement' },
    currency: { type: 'string', description: 'ISO currency code shown on the statement, e.g. IDR, NZD, USD' },
    periodStart: { type: 'string', description: 'ISO date, or empty string if not shown' },
    periodEnd: { type: 'string', description: 'ISO date, or empty string if not shown' },
    openingBalance: { type: ['number', 'null'], description: 'null if not shown' },
    closingBalance: { type: ['number', 'null'], description: 'null if not shown' },
    transactions: { type: 'array', items: TRANSACTION_SCHEMA, description: 'Every transaction line in the statement, in the order they appear' },
  },
  required: ['accountLabel', 'currency', 'transactions'],
  additionalProperties: false,
};

/** Extracts every transaction from a bank/Wise statement's raw text (already pulled out of a PDF
 * via pdf-extract.ts, or out of a CSV/XLSX via xlsx's sheet_to_csv — this function doesn't care
 * which, since by this point it's just text) — literal transcription only, never a
 * revenue-vs-expense or budget-category judgment call. That classification stays a human step in
 * the review table this feeds (StatementImportReview.tsx): this session's own experience reading
 * real statements by hand found genuine mixed-personal-and-school accounts and ambiguous
 * transfers that no automated categorization could have caught safely, so nothing here writes to
 * the database or is treated as final without an admin reviewing every row first. */
export async function parseBankStatementText(statementText: string): Promise<ParsedBankStatement> {
  const client = getClient();
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      system:
        'You are transcribing a bank or payment-provider statement into structured data. Extract every transaction line ' +
        'exactly as it appears — do not summarize, merge, skip, or invent transactions, and do not guess what a transaction ' +
        'is "for" beyond what the statement itself states. Preserve the statement’s own transaction order.',
      messages: [
        {
          role: 'user',
          content: `Extract every transaction from this bank statement text:\n\n${statementText}`,
        },
      ],
      tools: [
        {
          name: 'record_parsed_statement',
          description: "Records the statement's account details and every transaction line.",
          input_schema: PARSE_STATEMENT_SCHEMA as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: 'tool', name: 'record_parsed_statement' },
    });

    const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (!toolUse) {
      throw new Error(`Claude did not return parsed transactions (stop_reason: ${response.stop_reason}).`);
    }
    const result = toolUse.input as ParsedBankStatement;
    if (result.transactions.length === 0) {
      throw new Error('No transactions were found in this statement — check the file uploaded correctly.');
    }
    return result;
  } catch (err) {
    throw explainAnthropicError(err);
  }
}
