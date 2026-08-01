'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput } from '@/components/forms/FormField';

export default function ScheduleMeetingButton({
  letterId,
  defaultEmail,
  initiallySent,
}: {
  letterId: number;
  defaultEmail: string;
  initiallySent: boolean;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<'sent' | 'error' | null>(initiallySent ? 'sent' : null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function send() {
    setSending(true);
    setResult(null);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/letters-of-offer/${letterId}/schedule-meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setResult('sent');
      setExpanded(false);
      router.refresh();
    } catch (err) {
      setResult('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  if (!expanded) {
    return (
      <button type="button" onClick={() => setExpanded(true)} className="text-xs font-semibold text-teal-deep hover:underline">
        {result === 'sent' ? 'Sent ✓ — send again' : 'Schedule a meeting'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
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
      {result === 'error' && <span className="text-xs font-semibold text-orange-deep">{errorMessage}</span>}
    </div>
  );
}
