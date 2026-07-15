'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import FormStatusBanner from '@/components/forms/FormStatusBanner';
import { useFormSubmit } from '@/lib/useFormSubmit';

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'That login link is missing its token. Please request a new one below.',
  expired: 'That login link has expired or was already used. Please request a new one below.',
  server: 'Something went wrong verifying that link. Please request a new one below.',
};

function AccountLoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/account/bookings';
  const linkError = searchParams.get('error');
  const [email, setEmail] = useState('');
  const { status, errorMessage, submit } = useFormSubmit<{ ok: true; message: string }>('/api/account/login');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await submit({ email, next });
  }

  return (
    <div className="w-full max-w-sm rounded-md border border-sand-line bg-paper p-8 shadow-soft">
      <div className="mb-5 flex justify-center rounded-md bg-teal py-5">
        <Image src="/images/logo-full.png" alt="Selong Bay School" width={378} height={299} className="h-20 w-auto" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-ink">Log in</h1>
      <p className="mt-1 text-sm text-ink-soft">We&apos;ll email you a link. No password needed.</p>

      {linkError && status !== 'success' && (
        <p className="mt-4 rounded-md border border-orange/30 bg-orange/10 px-4 py-3 text-sm font-semibold text-orange-deep">
          {ERROR_MESSAGES[linkError] || ERROR_MESSAGES.server}
        </p>
      )}

      {status === 'success' ? (
        <div className="mt-6">
          <FormStatusBanner status={status} successMessage="If that email has an account, we've sent a login link. It's valid for 30 minutes." />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <Field label="Email" htmlFor="account-login-email" required>
            <TextInput
              id="account-login-email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          {status === 'error' && <FormStatusBanner status={status} errorMessage={errorMessage} successMessage="" />}
          <Button type="submit" variant="primary" disabled={status === 'submitting'} fullWidth>
            {status === 'submitting' ? 'Sending…' : 'Email me a login link'}
          </Button>
        </form>
      )}

      <p className="mt-4 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link href={`/account/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-teal-deep underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function AccountLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <Suspense fallback={null}>
        <AccountLoginForm />
      </Suspense>
    </div>
  );
}
