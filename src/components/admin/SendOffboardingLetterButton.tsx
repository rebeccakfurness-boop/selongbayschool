'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput } from '@/components/forms/FormField';

/** Create + send in one action (see the API route's own comment for why) — this button doesn't
 * need a letterId the way SendLetterOfOfferButton does, since it's making a brand new letter each
 * time it's used, not re-sending an existing one. */
export default function SendOffboardingLetterButton({ childId, defaultEmail }: { childId: number; defaultEmail: string }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function send() {
    setSending(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/offboarding-letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setExpanded(false);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  if (!expanded) {
    return (
      <button type="button" onClick={() => setExpanded(true)} className="text-sm font-semibold text-teal-deep hover:underline">
        + Send off-boarding letter
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <TextInput
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="parent@email.com"
        className="!w-48 !py-1 !text-xs"
      />
      <button type="button" onClick={send} disabled={sending || !email.trim()} className="text-xs font-bold text-teal-deep hover:underline disabled:opacity-40">
        {sending ? 'Sending…' : 'Send'}
      </button>
      <button type="button" onClick={() => setExpanded(false)} className="text-xs text-ink-soft hover:underline">
        Cancel
      </button>
      {errorMessage && <span className="text-xs font-semibold text-orange-deep">{errorMessage}</span>}
    </div>
  );
}
