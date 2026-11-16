'use client';

import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';

function formatIDR(n: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(n))}`;
}

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
  action: 'donation' | 'expense' | 'skip';
  amountIdr: string;
  label: string;
  category: string;
  notes: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Uploads a bank/Wise statement (PDF, CSV, or XLSX) for the Serangan programme, has it
 * transcribed (parseBankStatementText -- literal transcription only, no donation/expense
 * judgment), then shows every transaction in an editable table before anything is written.
 * Mirrors the admin Budget Tracker's StatementImportReview.tsx, but writes into
 * serangan_donations/serangan_expenditures instead of the admin's categorized revenue/expense
 * tables -- money in becomes a donation, money out becomes an expenditure, with a free-text
 * category rather than a fixed category list. */
export default function SeranganStatementImportReview({ onImported }: { onImported?: () => void }) {
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
      const blob = await upload(`serangan-statement-imports/${Date.now()}-${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/serangan/statements/upload',
      });

      setBusyLabel('Reading the statement… this can take a minute for a long one.');
      const res = await fetch('/api/serangan/statements/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: blob.url }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
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
          action: t.direction === 'credit' ? 'donation' : 'expense',
          amountIdr: parsed.currency === 'IDR' ? String(Math.round(t.amount)) : '',
          label: t.counterparty || t.description,
          category: '',
          notes: '',
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
  const donationTotal = included.filter((r) => r.action === 'donation').reduce((sum, r) => sum + (Number(r.amountIdr) || 0), 0);
  const expenseTotal = included.filter((r) => r.action === 'expense').reduce((sum, r) => sum + (Number(r.amountIdr) || 0), 0);

  function rowIsValid(r: ReviewRow): boolean {
    if (r.action === 'skip') return true;
    const amount = Number(r.amountIdr);
    if (!Number.isFinite(amount) || amount <= 0) return false;
    if (r.action === 'expense' && !r.label.trim()) return false;
    return true;
  }

  const invalidCount = rows.filter((r) => !rowIsValid(r)).length;

  async function handleImport() {
    if (!statement) return;
    setError(null);
    if (invalidCount > 0) {
      setError(`${invalidCount} row(s) still need an amount${rows.some((r) => r.action === 'expense' && !r.label.trim()) ? ' and/or description' : ''} before importing — fix or skip them.`);
      return;
    }
    if (included.length === 0) {
      setError('Nothing to import — every row is marked Skip.');
      return;
    }

    setBusy(true);
    setBusyLabel('Importing…');
    try {
      const res = await fetch('/api/serangan/statements/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donations: included
            .filter((r) => r.action === 'donation')
            .map((r) => ({
              donationDate: r.date || statement.periodStart,
              donorName: r.label || '',
              amountIdr: Number(r.amountIdr),
              notes: r.notes || '',
            })),
          expenditures: included
            .filter((r) => r.action === 'expense')
            .map((r) => ({
              expenseDate: r.date || statement.periodStart,
              category: r.category || '',
              description: r.label || r.description,
              amountIdr: Number(r.amountIdr),
            })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not import these transactions.');

      setImportedCount(included.length);
      setStage('done');
      onImported?.();
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
        <p className="mt-1 text-sm text-ink-soft">Donations and Expenditure below now reflect these entries.</p>
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
          mark as a donation, an expense, or skip — nothing is saved until you confirm.
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
    <div className="flex flex-col gap-4 rounded-md border border-sand-line bg-paper p-6 shadow-soft">
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
            Donations included: <strong className="text-teal-deep">{formatIDR(donationTotal)}</strong>
          </span>
          <span>
            Expenses included: <strong className="text-ink">{formatIDR(expenseTotal)}</strong>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((r) => {
          const valid = rowIsValid(r);
          return (
            <div
              key={r.key}
              className={`grid grid-cols-1 gap-2 rounded-md border p-3 shadow-soft sm:grid-cols-[100px_1fr_120px_130px_1fr_1fr] sm:items-center ${
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
                <option value="donation">Donation</option>
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
                placeholder={r.action === 'donation' ? 'Donor (optional)' : 'Vendor / description'}
                disabled={r.action === 'skip'}
                className="rounded-sm border border-sand-line bg-white px-2 py-1.5 text-sm disabled:opacity-40"
              />

              {r.action === 'expense' ? (
                <input
                  type="text"
                  value={r.category}
                  onChange={(e) => updateRow(r.key, { category: e.target.value })}
                  placeholder="Category (optional)"
                  className="rounded-sm border border-sand-line bg-white px-2 py-1.5 text-sm"
                />
              ) : r.action === 'donation' ? (
                <input
                  type="text"
                  value={r.notes}
                  onChange={(e) => updateRow(r.key, { notes: e.target.value })}
                  placeholder="Notes (optional)"
                  className="rounded-sm border border-sand-line bg-white px-2 py-1.5 text-sm"
                />
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
