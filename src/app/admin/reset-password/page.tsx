'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';

function AdminResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('This reset link is missing its token. Please request a new one.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not reset your password.');
        setSubmitting(false);
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 1200);
    } catch {
      setError('Could not reach the server. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-md border border-sand-line bg-paper p-8 shadow-soft">
      <div className="mb-5 flex justify-center rounded-md bg-teal py-5">
        <Image src="/images/logo-full.png" alt="Selong Bay School" width={378} height={299} className="h-20 w-auto" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-ink">Set a new password</h1>

      {!token ? (
        <p className="mt-4 text-sm font-semibold text-orange-deep">
          This reset link is missing its token. Please request a new one from the{' '}
          <Link href="/admin/forgot-password" className="underline">
            forgot password
          </Link>{' '}
          page.
        </p>
      ) : done ? (
        <p className="mt-4 rounded-md border border-teal/30 bg-aqua/50 px-5 py-4 text-[15px] font-semibold text-teal-deep">
          Password updated. Taking you to the dashboard…
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <Field label="New password" htmlFor="reset-password" required>
            <TextInput
              id="reset-password"
              type="password"
              required
              autoFocus
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirm new password" htmlFor="reset-password-confirm" required>
            <TextInput
              id="reset-password-confirm"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>
          {error && <p role="alert" className="text-sm font-semibold text-orange-deep">{error}</p>}
          <Button type="submit" variant="primary" disabled={submitting} fullWidth>
            {submitting ? 'Saving…' : 'Set new password'}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <Suspense fallback={null}>
        <AdminResetPasswordForm />
      </Suspense>
    </div>
  );
}
