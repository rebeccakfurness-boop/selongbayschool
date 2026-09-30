'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import { TextInput } from '@/components/forms/FormField';
import { formatIDR } from '@/lib/site-content';
import type { CcaActivityRow, CcaPriceOverrideRow } from '@/lib/cca';

export default function CcaOverridesSection({
  childId,
  ccaEnabled,
  overrides,
  activities,
  hasSubmittedSelection,
}: {
  childId: number;
  ccaEnabled: boolean;
  overrides: CcaPriceOverrideRow[];
  activities: CcaActivityRow[];
  hasSubmittedSelection: boolean;
}) {
  const router = useRouter();
  const [ccaId, setCcaId] = useState(activities[0]?.id ?? '');
  const [priceIDR, setPriceIDR] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingEnabled, setTogglingEnabled] = useState(false);

  async function toggleEnabled() {
    setTogglingEnabled(true);
    try {
      const res = await fetch(`/api/admin/children/${childId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ccaEnabled: !ccaEnabled }),
      });
      if (res.ok) router.refresh();
    } finally {
      setTogglingEnabled(false);
    }
  }

  async function addOverride(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/cca/price-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, ccaId: Number(ccaId), priceIDR: Number(priceIDR) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setPriceIDR('0');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function removeOverride(id: number) {
    if (!confirm('Remove this price override?')) return;
    const res = await fetch(`/api/admin/cca/price-overrides/${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-base font-semibold text-ink">Co-Curricular Activities</h3>
        <div className="flex items-center gap-3">
          {hasSubmittedSelection && (
            <Link href={`/admin/families/${childId}/cca`} className="text-sm font-semibold text-teal-deep hover:underline">
              + Review CCA selections
            </Link>
          )}
          <button
            type="button"
            onClick={toggleEnabled}
            disabled={togglingEnabled}
            className={`rounded-full px-3 py-1 text-xs font-bold disabled:opacity-50 ${ccaEnabled ? 'bg-teal/15 text-teal-deep' : 'bg-sand text-ink-soft'}`}
          >
            {togglingEnabled ? 'Saving…' : ccaEnabled ? 'CCA On' : 'CCA Off'}
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        {ccaEnabled
          ? "This child's parent can select CCAs from their portal."
          : "Off: this child won't appear on the CCA selection form until turned on."}
      </p>

      <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-ink-soft">Price overrides</h4>
      <p className="mt-1 text-xs text-ink-soft">Overrides the normal CCA/option price for this child specifically, e.g. a scholarship or sibling waiver.</p>

      <ul className="mt-3 flex flex-col gap-2">
        {overrides.map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-2 rounded-sm border border-sand-line px-3 py-2 text-sm">
            <span className="font-semibold text-ink">{o.cca_name} <span className="text-ink-soft">— {formatIDR(o.price_idr)}</span></span>
            <button type="button" onClick={() => removeOverride(o.id)} className="text-xs font-semibold text-orange-deep hover:underline">
              Remove
            </button>
          </li>
        ))}
        {overrides.length === 0 && <li className="text-sm text-ink-soft">No overrides set.</li>}
      </ul>

      {activities.length > 0 && (
        <form onSubmit={addOverride} className="mt-3 flex flex-wrap items-end gap-2">
          <select
            value={ccaId}
            onChange={(e) => setCcaId(Number(e.target.value))}
            className="rounded-sm border border-sand-line bg-white px-3 py-2 text-sm text-ink"
          >
            {activities.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <TextInput type="number" min={0} step={1000} value={priceIDR} onChange={(e) => setPriceIDR(e.target.value)} className="w-28 !py-2" />
          <Button type="submit" variant="ghost" className="px-3 py-1.5 text-xs" disabled={saving}>
            {saving ? 'Saving…' : '+ Add override'}
          </Button>
          {error && <span className="text-xs font-semibold text-orange-deep">{error}</span>}
        </form>
      )}
    </div>
  );
}
