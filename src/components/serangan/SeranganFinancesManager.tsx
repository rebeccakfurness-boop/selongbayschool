'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import Button from '@/components/Button';
import { formatDate } from '@/lib/admin-format';
import SeranganStatementImportReview from './SeranganStatementImportReview';

export interface ReloadableSectionHandle {
  reload: () => void;
}

function formatIDR(n: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(n))}`;
}
function todayValue(): string {
  return new Date().toISOString().slice(0, 10);
}
function currentYear(): number {
  return new Date().getUTCFullYear();
}

export interface SeranganBudgetItem {
  year: number;
  budget_amount_idr: string;
  notes: string | null;
}
export interface SeranganDonationItem {
  id: number;
  donation_date: string;
  donor_name: string | null;
  amount_idr: string;
  notes: string | null;
}
export interface SeranganExpenditureItem {
  id: number;
  expense_date: string;
  category: string | null;
  description: string;
  amount_idr: string;
}

function BudgetSection({ initial }: { initial: SeranganBudgetItem[] }) {
  const [budgets, setBudgets] = useState(initial);
  const year = currentYear();
  const current = budgets.find((b) => b.year === year);
  const [amount, setAmount] = useState(current?.budget_amount_idr ?? '0');
  const [notes, setNotes] = useState(current?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/serangan/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, budgetAmountIdr: Number(amount), notes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save the budget.');
      setBudgets((prev) => {
        const next = prev.filter((b) => b.year !== year);
        return [{ year, budget_amount_idr: amount, notes: notes || null }, ...next];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the budget.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold text-ink">{year} Budget</h2>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Field label="Annual budget (IDR)" htmlFor="budget-amount">
          <TextInput id="budget-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Button type="button" variant="primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save budget'}
        </Button>
      </div>
      <div className="mt-3">
        <Field label="Notes (optional)" htmlFor="budget-notes">
          <TextArea id="budget-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
      {budgets.filter((b) => b.year !== year).length > 0 && (
        <div className="mt-4 border-t border-sand-line pt-3 text-xs text-ink-soft">
          Previous years: {budgets.filter((b) => b.year !== year).map((b) => `${b.year} (${formatIDR(Number(b.budget_amount_idr))})`).join(', ')}
        </div>
      )}
    </div>
  );
}

const DonationsSection = forwardRef<ReloadableSectionHandle, { initial: SeranganDonationItem[] }>(function DonationsSection({ initial }, ref) {
  const [donations, setDonations] = useState(initial);
  const [form, setForm] = useState({ donationDate: todayValue(), donorName: '', amountIdr: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/serangan/donations');
    const data = await res.json().catch(() => ({}));
    if (res.ok) setDonations(data.donations);
  }

  useImperativeHandle(ref, () => ({ reload: load }));

  const canSave = form.donationDate && form.amountIdr !== '';

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/serangan/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amountIdr: Number(form.amountIdr) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save that donation.');
      setForm({ donationDate: todayValue(), donorName: '', amountIdr: '', notes: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that donation.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    setDonations((prev) => prev.filter((d) => d.id !== id));
    await fetch(`/api/serangan/donations/${id}`, { method: 'DELETE' });
  }

  const total = donations.reduce((sum, d) => sum + Number(d.amount_idr), 0);

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold text-ink">Donations</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Date" htmlFor="don-date" required>
          <TextInput id="don-date" type="date" value={form.donationDate} onChange={(e) => setForm((f) => ({ ...f, donationDate: e.target.value }))} />
        </Field>
        <Field label="Donor (optional)" htmlFor="don-name">
          <TextInput id="don-name" value={form.donorName} onChange={(e) => setForm((f) => ({ ...f, donorName: e.target.value }))} placeholder="Leave blank for anonymous" />
        </Field>
        <Field label="Amount (IDR)" htmlFor="don-amount" required>
          <TextInput id="don-amount" type="number" min={0} value={form.amountIdr} onChange={(e) => setForm((f) => ({ ...f, amountIdr: e.target.value }))} />
        </Field>
        <Field label="Notes (optional)" htmlFor="don-notes">
          <TextInput id="don-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </Field>
      </div>
      <div className="mt-3">
        <Button type="button" variant="primary" onClick={save} disabled={!canSave || saving}>
          {saving ? 'Saving…' : 'Add donation'}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}

      <div className="mt-4 flex flex-col gap-2 border-t border-sand-line pt-4">
        {donations.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-2 rounded-sm border border-sand-line p-3 text-sm">
            <div>
              <span className="font-semibold text-ink">{formatDate(d.donation_date)}</span>{' '}
              <span className="text-ink-soft">{d.donor_name || 'Anonymous'}{d.notes ? ` · ${d.notes}` : ''}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-teal-deep">{formatIDR(Number(d.amount_idr))}</span>
              <button type="button" onClick={() => remove(d.id)} className="text-xs font-semibold text-orange-deep hover:underline">Remove</button>
            </div>
          </div>
        ))}
        {donations.length === 0 && <p className="text-sm text-ink-soft">No donations recorded yet.</p>}
      </div>
      <p className="mt-3 text-right text-sm font-semibold text-ink">Total: {formatIDR(total)}</p>
    </div>
  );
});

const ExpendituresSection = forwardRef<ReloadableSectionHandle, { initial: SeranganExpenditureItem[] }>(function ExpendituresSection({ initial }, ref) {
  const [expenditures, setExpenditures] = useState(initial);
  const [form, setForm] = useState({ expenseDate: todayValue(), category: '', description: '', amountIdr: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/serangan/expenditures');
    const data = await res.json().catch(() => ({}));
    if (res.ok) setExpenditures(data.expenditures);
  }

  useImperativeHandle(ref, () => ({ reload: load }));

  const canSave = form.expenseDate && form.description.trim() && form.amountIdr !== '';

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/serangan/expenditures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amountIdr: Number(form.amountIdr) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save that expenditure.');
      setForm({ expenseDate: todayValue(), category: '', description: '', amountIdr: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that expenditure.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    setExpenditures((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/serangan/expenditures/${id}`, { method: 'DELETE' });
  }

  const total = expenditures.reduce((sum, e) => sum + Number(e.amount_idr), 0);

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold text-ink">Expenditure</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Date" htmlFor="exp-date" required>
          <TextInput id="exp-date" type="date" value={form.expenseDate} onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))} />
        </Field>
        <Field label="Category (optional)" htmlFor="exp-category">
          <TextInput id="exp-category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Materials, Snacks, T-shirts" />
        </Field>
        <Field label="Description" htmlFor="exp-description" required>
          <TextInput id="exp-description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </Field>
        <Field label="Amount (IDR)" htmlFor="exp-amount" required>
          <TextInput id="exp-amount" type="number" min={0} value={form.amountIdr} onChange={(e) => setForm((f) => ({ ...f, amountIdr: e.target.value }))} />
        </Field>
      </div>
      <div className="mt-3">
        <Button type="button" variant="primary" onClick={save} disabled={!canSave || saving}>
          {saving ? 'Saving…' : 'Add expenditure'}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}

      <div className="mt-4 flex flex-col gap-2 border-t border-sand-line pt-4">
        {expenditures.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-2 rounded-sm border border-sand-line p-3 text-sm">
            <div>
              <span className="font-semibold text-ink">{formatDate(e.expense_date)}</span>{' '}
              <span className="text-ink-soft">{e.category ? `${e.category} · ` : ''}{e.description}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-orange-deep">{formatIDR(Number(e.amount_idr))}</span>
              <button type="button" onClick={() => remove(e.id)} className="text-xs font-semibold text-orange-deep hover:underline">Remove</button>
            </div>
          </div>
        ))}
        {expenditures.length === 0 && <p className="text-sm text-ink-soft">No expenditure recorded yet.</p>}
      </div>
      <p className="mt-3 text-right text-sm font-semibold text-ink">Total: {formatIDR(total)}</p>
    </div>
  );
});

export default function SeranganFinancesManager({
  initialBudgets,
  initialDonations,
  initialExpenditures,
}: {
  initialBudgets: SeranganBudgetItem[];
  initialDonations: SeranganDonationItem[];
  initialExpenditures: SeranganExpenditureItem[];
}) {
  const donationsRef = useRef<ReloadableSectionHandle>(null);
  const expendituresRef = useRef<ReloadableSectionHandle>(null);

  return (
    <div className="flex flex-col gap-6">
      <SeranganStatementImportReview
        onImported={() => {
          donationsRef.current?.reload();
          expendituresRef.current?.reload();
        }}
      />
      <BudgetSection initial={initialBudgets} />
      <DonationsSection ref={donationsRef} initial={initialDonations} />
      <ExpendituresSection ref={expendituresRef} initial={initialExpenditures} />
    </div>
  );
}
