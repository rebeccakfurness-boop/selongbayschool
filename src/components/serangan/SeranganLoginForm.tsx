'use client';

import Link from 'next/link';
import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';

function SeranganLoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/serangan/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Login failed.');
        setSubmitting(false);
        return;
      }
      const next = searchParams?.get('next') || '/serangan';
      router.push(next);
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-md border border-sand-line bg-paper p-8 shadow-soft">
      <h1 className="font-display text-2xl font-semibold text-ink">Serangan English School</h1>
      <p className="mt-1 text-sm text-ink-soft">Programme dashboard login.</p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <Field label="Email" htmlFor="serangan-email" required>
          <TextInput
            id="serangan-email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="serangan-password" required>
          <TextInput
            id="serangan-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <p role="alert" className="text-sm font-semibold text-orange-deep">{error}</p>}
        <Button type="submit" variant="primary" disabled={submitting} fullWidth>
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/serangan/forgot-password" className="font-semibold text-teal-deep underline">
          Forgot password?
        </Link>
      </p>
    </div>
  );
}

export default function SeranganLoginForm() {
  return (
    <Suspense fallback={null}>
      <SeranganLoginFormInner />
    </Suspense>
  );
}
