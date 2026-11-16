'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import FormStatusBanner from '@/components/forms/FormStatusBanner';
import { useFormSubmit } from '@/lib/useFormSubmit';

function SeranganForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const { status, errorMessage, submit } = useFormSubmit<{ ok: true; message: string }>('/api/serangan/forgot-password');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await submit({ email });
  }

  return (
    <div className="w-full max-w-sm rounded-md border border-sand-line bg-paper p-8 shadow-soft">
      <h1 className="font-display text-2xl font-semibold text-ink">Forgot password</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Enter your Serangan English School dashboard email and we&apos;ll send you a link to reset your password.
      </p>

      {status === 'success' ? (
        <div className="mt-6">
          <FormStatusBanner
            status={status}
            successMessage="If that email has an account, we've sent a password reset link. It's valid for 1 hour."
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <Field label="Email" htmlFor="forgot-email" required>
            <TextInput
              id="forgot-email"
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
            {status === 'submitting' ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}

      <p className="mt-4 text-center text-sm">
        <Link href="/serangan/login" className="font-semibold text-teal-deep underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}

export default function SeranganForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <SeranganForgotPasswordForm />
    </div>
  );
}
