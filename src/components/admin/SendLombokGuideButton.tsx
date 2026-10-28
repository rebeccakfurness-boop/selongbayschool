'use client';

import { useState } from 'react';
import { TextInput } from '@/components/forms/FormField';

/** Same expand/email/send shape as SendWelcomeLetterButton, posting to
 * /api/admin/lombok-guide/send instead -- no childId needed (the guide has no per-family
 * content), just the email address and the child's name for the email greeting. */
export default function SendLombokGuideButton({ childFullName, defaultEmail }: { childFullName: string; defaultEmail: string }) {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function send() {
    setSending(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/lombok-guide/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, childFullName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setExpanded(false);
      setSent(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  if (!expanded) {
    return (
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => { setExpanded(true); setSent(false); }} className="text-sm font-semibold text-teal-deep hover:underline">
          {sent ? 'Sent -- send again' : '+ Send Lombok Guide'}
        </button>
        {sent && <span className="text-xs font-semibold text-teal-deep">✓ Sent</span>}
      </div>
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
