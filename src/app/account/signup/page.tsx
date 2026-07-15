'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import FormStatusBanner from '@/components/forms/FormStatusBanner';
import { useFormSubmit } from '@/lib/useFormSubmit';

function AccountSignupForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/account/bookings';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const { status, errorMessage, submit } = useFormSubmit<{ ok: true; message: string }>('/api/account/signup');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await submit({ name, email, phone, next });
  }

  return (
    <div className="w-full max-w-sm rounded-md border border-sand-line bg-paper p-8 shadow-soft">
      <div className="mb-5 flex justify-center rounded-md bg-teal py-5">
        <Image src="/images/logo-full.png" alt="Selong Bay School" width={378} height={299} className="h-20 w-auto" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-ink">Create an account</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Save your details for faster bookings, and see your booking history. We&apos;ll email you a link — no password needed.
      </p>

      {status === 'success' ? (
        <div className="mt-6">
          <FormStatusBanner status={status} successMessage="We've emailed you a link to access your account. It's valid for 30 minutes." />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <Field label="Name" htmlFor="account-signup-name" required>
            <TextInput id="account-signup-name" required autoFocus autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email" htmlFor="account-signup-email" required>
            <TextInput
              id="account-signup-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Phone" htmlFor="account-signup-phone">
            <TextInput id="account-signup-phone" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          {status === 'error' && <FormStatusBanner status={status} errorMessage={errorMessage} successMessage="" />}
          <Button type="submit" variant="primary" disabled={status === 'submitting'} fullWidth>
            {status === 'submitting' ? 'Sending…' : 'Sign up'}
          </Button>
        </form>
      )}

      <p className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <Link href={`/account/login?next=${encodeURIComponent(next)}`} className="font-semibold text-teal-deep underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function AccountSignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <Suspense fallback={null}>
        <AccountSignupForm />
      </Suspense>
    </div>
  );
}
