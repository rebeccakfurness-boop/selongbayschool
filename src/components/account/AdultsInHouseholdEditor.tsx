'use client';

import { useState } from 'react';

/** Self-reported, since there's no reliable existing source to compute it from (see the schema
 * comment on customers.adults_in_household in lib/db.ts) -- a small inline editor right next to
 * the card it actually affects, rather than buried in general Account Settings. Owns and displays
 * the count itself (not just an edit control for a value shown elsewhere) so the number on screen
 * updates the moment it's saved, with no page reload needed. */
export default function AdultsInHouseholdEditor({ initial }: { initial: number }) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/account/discount-card/adults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adultsInHousehold: draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save that.');
      setSaved(draft);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that.');
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div>
        <p className="font-display text-3xl font-bold text-teal-deep">{saved}</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Adult{saved === 1 ? '' : 's'}</p>
        <button type="button" onClick={() => { setDraft(saved); setEditing(true); }} className="mt-1 text-[11px] font-semibold text-teal-deep hover:underline">
          Edit
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-1.5">
        <input
          type="number"
          min={1}
          max={10}
          value={draft}
          onChange={(e) => setDraft(Number(e.target.value))}
          className="w-14 rounded-sm border border-sand-line bg-white px-2 py-1 text-center text-sm"
        />
      </div>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Adults</p>
      <div className="mt-1 flex items-center justify-center gap-2">
        <button type="button" onClick={save} disabled={saving} className="text-[11px] font-semibold text-teal-deep hover:underline disabled:opacity-40">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={() => { setEditing(false); setError(null); }} className="text-[11px] font-semibold text-ink-soft hover:underline">
          Cancel
        </button>
      </div>
      {error && <p className="mt-1 text-[11px] font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
