'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';

export interface GuardianLink {
  customer_id: number;
  name: string | null;
  email: string;
  relationship: string | null;
}

export default function GuardianLinksSection({ childId, initial }: { childId: number; initial: GuardianLink[] }) {
  const router = useRouter();
  const [guardians, setGuardians] = useState(initial);
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function link() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/children/${childId}/guardians`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, relationship: relationship || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to link guardian');
      setEmail('');
      setRelationship('');
      router.refresh();
      setGuardians((prev) => [...prev.filter((g) => g.email !== email), { customer_id: 0, name: null, email, relationship: relationship || null }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link guardian');
    } finally {
      setSaving(false);
    }
  }

  async function unlink(customerId: number) {
    setGuardians((prev) => prev.filter((g) => g.customer_id !== customerId));
    await fetch(`/api/admin/children/${childId}/guardians/${customerId}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h3 className="font-display text-base font-semibold text-ink">Linked Parent Portal Accounts</h3>
      <p className="mt-1 text-xs text-ink-soft">
        Controls who can see this child in the parent portal (/account). Linking an email that has never logged in
        creates the account for them. They can then use &quot;Log in&quot; with that email to get a magic link.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {guardians.map((g) => (
          <li key={g.email} className="flex items-center justify-between gap-2 rounded-sm border border-sand-line px-3 py-2 text-sm">
            <span>
              {g.name ? `${g.name}, ` : ''}
              {g.email}
              {g.relationship ? ` (${g.relationship})` : ''}
            </span>
            <button type="button" onClick={() => unlink(g.customer_id)} className="text-xs font-semibold text-orange-deep hover:underline">
              Unlink
            </button>
          </li>
        ))}
        {guardians.length === 0 && <li className="text-sm text-ink-soft">No parent portal accounts linked yet.</li>}
      </ul>
      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-sand-line pt-4">
        <Field label="Parent email" htmlFor="guardian-email">
          <TextInput id="guardian-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Relationship (optional)" htmlFor="guardian-relationship">
          <TextInput id="guardian-relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g. Mother" />
        </Field>
        <Button type="button" variant="ghost" onClick={link} disabled={saving || !email.trim()}>
          {saving ? 'Linking…' : 'Link guardian'}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
