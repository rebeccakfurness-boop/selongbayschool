'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { TextInput } from '@/components/forms/FormField';
import { formatBudgetIDR } from '@/lib/budget-shared';
import { formatDateTime } from '@/lib/admin-format';

export interface CategoryWithHistory {
  id: number;
  name: string;
  monthly_budget_idr: number;
  is_archived: boolean;
  history: { id: number; old_value_idr: number; new_value_idr: number; changed_by_label: string | null; changed_at: string }[];
}

function CategoryRow({ category }: { category: CategoryWithHistory }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(category.monthly_budget_idr));
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/budget/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyBudgetIdr: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function toggleArchive() {
    await fetch(`/api/admin/budget/categories/${category.id}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !category.is_archived }),
    });
    router.refresh();
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-4 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-display text-base font-semibold text-ink">{category.name}</div>
          {category.is_archived && <span className="text-xs font-bold text-ink-soft">Archived</span>}
        </div>

        {editing ? (
          <div className="flex items-center gap-2">
            <TextInput
              type="number"
              inputMode="numeric"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="!w-40 !py-2"
              autoFocus
            />
            <button type="button" onClick={save} disabled={saving} className="text-sm font-bold text-teal-deep hover:underline disabled:opacity-40">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => { setEditing(false); setValue(String(category.monthly_budget_idr)); }} className="text-sm text-ink-soft hover:underline">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <span className="font-display text-lg font-semibold tabular-nums text-ink">{formatBudgetIDR(category.monthly_budget_idr)}</span>
            <button type="button" onClick={() => setEditing(true)} className="text-sm font-semibold text-teal-deep hover:underline">
              Edit
            </button>
            <button type="button" onClick={toggleArchive} className="text-sm font-semibold text-ink-soft hover:underline">
              {category.is_archived ? 'Unarchive' : 'Archive'}
            </button>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-orange-deep">{error}</p>}

      {category.history.length > 0 && (
        <div className="mt-2">
          <button type="button" onClick={() => setShowHistory((v) => !v)} className="text-xs font-semibold text-ink-soft hover:underline">
            {showHistory ? 'Hide' : 'Show'} change history ({category.history.length})
          </button>
          {showHistory && (
            <ul className="mt-2 flex flex-col gap-1.5 border-l-2 border-sand-line pl-3">
              {category.history.map((h) => (
                <li key={h.id} className="text-xs text-ink-soft">
                  {formatBudgetIDR(h.old_value_idr)} <span aria-hidden="true">&rarr;</span> {formatBudgetIDR(h.new_value_idr)} by{' '}
                  <span className="font-semibold text-ink">{h.changed_by_label ?? 'unknown'}</span> on {formatDateTime(h.changed_at)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function BudgetSetupManager({ categories }: { categories: CategoryWithHistory[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('0');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addCategory() {
    setAdding(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/budget/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, monthlyBudgetIdr: budget }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to add category');
      setName('');
      setBudget('0');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add category');
    } finally {
      setAdding(false);
    }
  }

  const active = categories.filter((c) => !c.is_archived);
  const archived = categories.filter((c) => c.is_archived);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">New category</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="new-cat-name" className="text-xs font-bold text-ink-soft">Name</label>
            <TextInput id="new-cat-name" value={name} onChange={(e) => setName(e.target.value)} className="!w-56" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="new-cat-budget" className="text-xs font-bold text-ink-soft">Starting monthly budget (IDR)</label>
            <TextInput id="new-cat-budget" type="number" inputMode="numeric" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} className="!w-44" />
          </div>
          <Button type="button" variant="primary" onClick={addCategory} disabled={adding || !name.trim()}>
            {adding ? 'Adding…' : 'Add category'}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm font-semibold text-orange-deep">{error}</p>}
      </div>

      <div className="flex flex-col gap-3">
        {active.map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
      </div>

      {archived.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-bold text-ink-soft">Archived</h3>
          <div className="mt-2 flex flex-col gap-3">
            {archived.map((c) => (
              <CategoryRow key={c.id} category={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
