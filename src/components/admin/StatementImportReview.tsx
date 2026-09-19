'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { formatBudgetIDR } from '@/lib/budget-shared';

interface ParsedStatementTransaction {
  date: string;
  description: string;
  amount: number;
  direction: 'credit' | 'debit';
  counterparty: string;
}

interface ParsedBankStatement {
  accountLabel: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  openingBalance?: number;
  closingBalance?: number;
  transactions: ParsedStatementTransaction[];
}

interface ReviewRow {
  key: string;
  date: string;
  description: string;
  rawAmount: number;
  currency: string;
  action: 'revenue' | 'expense' | 'skip';
  amountIdr: string;
  label: string;
  categoryId: number | '';
  authorizedBy: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Uploads a bank/Wise statement (PDF, CSV, or XLSX), has it transcribed via Gemini's free tier
 * (parseBankStatementText — literal transcription only, no revenue/expense or category
 * judgment), then shows every transaction in an editable table before anything is written. This
 * review step is not a formality: this session's own experience finding a mixed
 * personal-and-school account, and a transfer that needed a real conversation to categorize
 * correctly, means an admin has to look at and confirm every row -- nothing here auto-imports. */
export default function StatementImportReview({ categories }: { categories: { id: number; name: string }[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<'upload' | 'reviewing' | 'done'>('upload');
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [statement, setStatement] = useState<ParsedBankStatement | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      setBusyLabel('Uploading…');
      const blob = await upload(`statement-imports/${Date.now()}-${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/budget/statement-upload',
      });

      setBusyLabel('Reading the statement… this can take a minute for a long one.');
      const res = await fetch('/api/admin/budget/statements/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: blob.url }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // A null `data` means the response body wasn't JSON at all — most likely the request ran
        // past the server's own timeout and got killed before it could return a real error body,
        // rather than a normal caught error. Surfacing the status code either way means a future
        // failure is diagnosable from the message alone, not just "something went wrong".
        throw new Error(data?.error || `Could not read this statement (server returned ${res.status}${res.status === 504 ? ' — timed out' : ''}).`);
      }

      const parsed = data as ParsedBankStatement;
      setStatement(parsed);
      setRows(
        parsed.transactions.map((t, i) => ({
          key: `${i}-${t.date}-${t.amount}`,
          date: DATE_RE.test(t.date) ? t.date : '',
          description: t.description,
          rawAmount: t.amount,
          currency: parsed.currency,
          action: t.direction === 'credit' ? 'revenue' : 'expense',
          amountIdr: parsed.currency === 'IDR' ? String(Math.round(t.amount)) : '',
          label: t.counterparty || t.description,
          categoryId: '',
          authorizedBy: parsed.accountLabel,
        }))
      );
      setStage('reviewing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read this statement.');
    } finally {
      setBusy(false);
      setBusyLabel('');
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function updateRow(key: string, patch: Partial<ReviewRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  const included = rows.filter((r) => r.action !== 'skip');
  const revenueTotal = included.filter((r) => r.action === 'revenue').reduce((sum, r) => sum + (Number(r.amountIdr) || 0), 0);
  const expenseTotal = included.filter((r) => r.action === 'expense').reduce((sum, r) => sum + (Number(r.amountIdr) || 0), 0);

  function rowIsValid(r: ReviewRow): boolean {
    if (r.action === 'skip') return true;
    const amount = Number(r.amountIdr);
    if (!Number.isFinite(amount) || amount <= 0) return false;
    if (r.action === 'expense' && !r.categoryId) return false;
    return true;
  }

  const invalidCount = rows.filter((r) => !rowIsValid(r)).length;

  async function handleImport() {
    if (!statement) return;
    setError(null);
    if (invalidCount > 0) {
      setError(`${invalidCount} row(s) still need an amount${rows.some((r) => r.action === 'expense' && !r.categoryId) ? ' and/or category' : ''} before importing — fix or skip them.`);
      return;
    }
    if (included.length === 0) {
      setError('Nothing to import — every row is marked Skip.');
      return;
    }

    setBusy(true);
    setBusyLabel('Importing…');
    try {
      const res = await fetch('/api/admin/budget/import-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceLabel: `${statement.accountLabel}${statement.periodStart ? ` (${statement.periodStart} to ${statement.periodEnd})` : ''}`,
          periodStart: DATE_RE.test(statement.periodStart) ? statement.periodStart : null,
          periodEnd: DATE_RE.test(statement.periodEnd) ? statement.periodEnd : null,
          openingBalanceIdr: statement.currency === 'IDR' && statement.openingBalance !== undefined ? Math.round(statement.openingBalance) : null,
          closingBalanceIdr: statement.currency === 'IDR' && statement.closingBalance !== undefined ? Math.round(statement.closingBalance) : null,
          revenue: included
            .filter((r) => r.action === 'revenue')
            .map((r) => ({ entryDate: r.date || statement.periodStart, amountIdr: Number(r.amountIdr), payerSource: r.label || 'Unknown', description: r.description })),
          expenses: included
            .filter((r) => r.action === 'expense')
            .map((r) => ({
              entryDate: r.date || statement.periodStart,
              amountIdr: Number(r.amountIdr),
              categoryId: r.categoryId,
              vendorDescription: r.label || r.description,
              authorizedBy: r.authorizedBy || statement.accountLabel,
            })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not import these transactions.');

      setImportedCount(included.length);
      setStage('done');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import these transactions.');
    } finally {
      setBusy(false);
      setBusyLabel('');
    }
  }

  function startOver() {
    setStatement(null);
    setRows([]);
    setError(null);
    setStage('upload');
  }

  if (stage === 'done') {
    return (
      <div className="rounded-md border border-teal/40 bg-teal/10 p-6 text-center">
        <p className="font-display text-lg font-semibold text-teal-deep">Imported {importedCount} transaction(s).</p>
        <p className="mt-1 text-sm text-ink-soft">The dashboard and Transaction Log now reflect these entries.</p>
        <button type="button" onClick={startOver} className="mt-4 text-sm font-bold text-teal-deep hover:underline">
          Import another statement
        </button>
      </div>
    );
  }

  if (stage === 'upload') {
    return (
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Import a bank statement</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Upload a PDF, CSV, or XLSX bank or Wise statement. Every transaction is transcribed for you to review, edit, and
          mark as revenue, an expense, or skip — nothing is saved until you confirm.
        </p>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-teal px-5 py-3 text-sm font-bold text-white hover:bg-teal-deep disabled:opacity-50">
          {busy ? busyLabel || 'Working…' : 'Choose a statement file'}
          <input ref={inputRef} type="file" accept=".pdf,.csv,.xlsx,.xls" onChange={handleFileChange} disabled={busy} className="hidden" />
        </label>
        {error && <p className="mt-3 font-semibold text-orange-deep">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-sand-line bg-cream/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-base font-semibold text-ink">{statement?.accountLabel}</p>
            <p className="text-xs text-ink-soft">
              {statement?.currency}
              {statement?.periodStart && ` · ${statement.periodStart} to ${statement.periodEnd}`}
              {statement?.closingBalance !== undefined && ` · Statement closing balance: ${statement.closingBalance.toLocaleString('en-US')} ${statement.currency}`}
            </p>
          </div>
          <button type="button" onClick={startOver} className="text-sm font-semibold text-ink-soft hover:underline">
            Start over
          </button>
        </div>
        {statement && statement.currency !== 'IDR' && (
          <p className="mt-2 text-xs font-semibold text-orange-deep">
            This statement is in {statement.currency}, not IDR — amounts were left blank below. Enter the IDR equivalent for each
            row you want to include.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-6 text-sm">
          <span>
            Revenue included: <strong className="text-teal-deep">{formatBudgetIDR(revenueTotal)}</strong>
          </span>
          <span>
            Expenses included: <strong className="text-ink">{formatBudgetIDR(expenseTotal)}</strong>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((r) => {
          const valid = rowIsValid(r);
          return (
            <div
              key={r.key}
              className={`grid grid-cols-1 gap-2 rounded-md border p-3 shadow-soft sm:grid-cols-[100px_1fr_140px_130px_1fr_1fr] sm:items-center ${
                valid ? 'border-sand-line bg-paper' : 'border-orange-deep/60 bg-orange/5'
              }`}
            >
              <div className="text-xs text-ink-soft">
                {r.date || '—'}
                <div className="mt-0.5 font-semibold tabular-nums text-ink">
                  {r.rawAmount.toLocaleString('en-US')} {r.currency}
                </div>
              </div>

              <div className="text-sm text-ink">{r.description}</div>

              <select
                value={r.action}
                onChange={(e) => updateRow(r.key, { action: e.target.value as ReviewRow['action'] })}
                className="rounded-sm border border-sand-line bg-white px-2 py-1.5 text-xs font-bold"
              >
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
                <option value="skip">Skip</option>
              </select>

              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={r.amountIdr}
                onChange={(e) => updateRow(r.key, { amountIdr: e.target.value })}
                placeholder="Amount (IDR)"
                disabled={r.action === 'skip'}
                className="rounded-sm border border-sand-line bg-white px-2 py-1.5 text-sm disabled:opacity-40"
              />

              <input
                type="text"
                value={r.label}
                onChange={(e) => updateRow(r.key, { label: e.target.value })}
                placeholder={r.action === 'revenue' ? 'Payer' : 'Vendor / description'}
                disabled={r.action === 'skip'}
                className="rounded-sm border border-sand-line bg-white px-2 py-1.5 text-sm disabled:opacity-40"
              />

              {r.action === 'expense' ? (
                <select
                  value={r.categoryId}
                  onChange={(e) => updateRow(r.key, { categoryId: e.target.value ? Number(e.target.value) : '' })}
                  className="rounded-sm border border-sand-line bg-white px-2 py-1.5 text-sm"
                >
                  <option value="">Choose a category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <span />
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="font-semibold text-orange-deep">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleImport}
          disabled={busy}
          className="rounded-full bg-teal px-6 py-3 text-sm font-bold text-white hover:bg-teal-deep disabled:opacity-50"
        >
          {busy ? busyLabel || 'Importing…' : `Import ${included.length} transaction(s)`}
        </button>
        <span className="text-xs text-ink-soft">{rows.length - included.length} skipped</span>
      </div>
    </div>
  );
}
