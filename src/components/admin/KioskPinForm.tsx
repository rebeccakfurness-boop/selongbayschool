'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';

export default function KioskPinForm({ configured }: { configured: boolean }) {
  const [pin, setPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/admin/attendance/kiosk-pin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save the PIN.');
      setPin('');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the PIN.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold text-ink">Gate Kiosk PIN</h2>
      <p className="mt-1 text-xs text-ink-soft">
        Staff enter this PIN once at <span className="font-mono">/kiosk/unlock</span> on the gate tablet to unlock
        check-in — it then stays unlocked on that device. {configured ? 'A PIN is currently set.' : 'No PIN is set yet — the kiosk cannot be unlocked until one is.'}
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Field label={configured ? 'New PIN' : 'Set PIN'} htmlFor="kiosk-pin">
          <TextInput id="kiosk-pin" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="e.g. 4821" />
        </Field>
        <Button type="button" variant="primary" onClick={save} disabled={saving || pin.trim().length < 4}>
          {saving ? 'Saving…' : 'Save PIN'}
        </Button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-orange-deep">{error}</p>}
      {success && <p className="mt-3 text-sm font-semibold text-teal-deep">PIN saved.</p>}
    </div>
  );
}
