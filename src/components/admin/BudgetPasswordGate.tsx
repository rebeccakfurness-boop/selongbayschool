'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';

/** The Budget Tracker's own password, on top of the normal admin login — this is meant for the
 * Principal, not every admin account. Correct password sets budgetUnlocked on the admin session
 * (12-hour TTL, same as the rest of the session) via /api/admin/budget/unlock. */
export default function BudgetPasswordGate() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/budget/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Incorrect password.');
        setSubmitting(false);
        return;
      }
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-md border border-sand-line bg-paper p-8 shadow-soft">
        <h1 className="font-display text-2xl font-semibold text-ink">Budget Tracker</h1>
        <p className="mt-1 text-sm text-ink-soft">Restricted to the Principal: enter the budget password to continue.</p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <Field label="Password" htmlFor="budget-password" required>
            <TextInput
              id="budget-password"
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && (
            <p role="alert" className="font-semibold text-orange-deep">
              {error}
            </p>
          )}
          <Button type="submit" variant="primary" disabled={submitting || !password}>
            {submitting ? 'Checking…' : 'Unlock'}
          </Button>
        </form>
      </div>
    </div>
  );
}
