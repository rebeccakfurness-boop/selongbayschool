'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import { TextInput } from '@/components/forms/FormField';

export default function LetterOfOfferAcceptForm({ token }: { token: string }) {
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/letters-of-offer/accept/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptedByName: name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not record your acceptance.');
      setAccepted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record your acceptance.');
    } finally {
      setSubmitting(false);
    }
  }

  if (accepted) {
    return (
      <div className="rounded-md border border-teal/30 bg-teal/10 p-6 text-center">
        <p className="font-display text-lg font-semibold text-teal-deep">Thank you, offer accepted!</p>
        <p className="mt-2 text-sm text-ink-soft">We&apos;ll be in touch shortly with the tuition invoice.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6">
      <h3 className="font-display text-base font-semibold text-ink">Accept this offer</h3>
      <div className="mt-3">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          className="!w-full"
        />
      </div>
      <label className="mt-3 flex items-start gap-2 text-sm text-ink-soft">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4" />
        I confirm I have reviewed the Letter of Offer above and accept it on behalf of my child.
      </label>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-orange-deep">{error}</p>}
      <div className="mt-4">
        <Button type="button" variant="primary" onClick={accept} disabled={submitting || !name.trim() || !agreed}>
          {submitting ? 'Submitting…' : 'Accept Letter of Offer'}
        </Button>
      </div>
    </div>
  );
}
