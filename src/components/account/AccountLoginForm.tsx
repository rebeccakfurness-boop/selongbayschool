'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import FormStatusBanner from '@/components/forms/FormStatusBanner';
import { useFormSubmit } from '@/lib/useFormSubmit';

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'That login link is missing its token. Please request a new one below.',
  expired: 'That login link has expired or was already used. Please request a new one below.',
  server: 'Something went wrong verifying that link. Please request a new one below.',
};

function AccountLoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get('next') || '/account';
  const linkError = searchParams?.get('error');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const { status, errorMessage, submit } = useFormSubmit<{ ok: true; message: string }>('/api/account/login');
  const { status: codeStatus, errorMessage: codeErrorMessage, submit: submitCode } = useFormSubmit<{ ok: true; next: string }>(
    '/api/account/verify-code'
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await submit({ email, next });
  }

  async function handleCodeSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await submitCode({ email, code, next });
    if (result) {
      router.push(result.next);
      router.refresh();
    }
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
          <FormStatusBanner status={status} successMessage="If that email has an account, we've sent a login link and a 6-digit code. Both are valid for 30 minutes." />
          <form onSubmit={handleCodeSubmit} className="mt-4 flex flex-col gap-4" noValidate>
            <Field label="6-digit code" htmlFor="account-login-code" required>
              <TextInput
                id="account-login-code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </Field>
            <p className="text-xs text-ink-soft">
              Opened the link from your email app and it didn&apos;t keep you logged in? Type the code from that same email
              here instead — it works in whichever browser you&apos;re using right now.
            </p>
            {codeStatus === 'error' && <FormStatusBanner status={codeStatus} errorMessage={codeErrorMessage} successMessage="" />}
            <Button type="submit" variant="primary" disabled={codeStatus === 'submitting' || code.length !== 6} fullWidth>
              {codeStatus === 'submitting' ? 'Checking…' : 'Log in with code'}
            </Button>
          </form>
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

export default function AccountLoginForm() {
  return (
    <Suspense fallback={null}>
      <AccountLoginFormInner />
    </Suspense>
  );
}
