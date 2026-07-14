'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import FormStatusBanner from '@/components/forms/FormStatusBanner';
import { useFormSubmit } from '@/lib/useFormSubmit';

function AdminForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const { status, errorMessage, submit } = useFormSubmit<{ ok: true; message: string }>('/api/admin/forgot-password');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await submit({ email });
  }

  return (
    <div className="w-full max-w-sm rounded-md border border-sand-line bg-paper p-8 shadow-soft">
      <div className="mb-5 flex justify-center rounded-md bg-teal py-5">
        <Image src="/images/logo-full.png" alt="Selong Bay School" width={378} height={299} className="h-20 w-auto" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-ink">Forgot password</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Enter your admin email and we&apos;ll send you a link to reset your password.
      </p>

      {status === 'success' ? (
        <div className="mt-6">
          <FormStatusBanner
            status={status}
            successMessage="If that email has an admin account, we've sent a password reset link. It's valid for 1 hour."
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
          {status === 'error' && (
            <FormStatusBanner status={status} errorMessage={errorMessage} successMessage="" />
          )}
          <Button type="submit" variant="primary" disabled={status === 'submitting'} fullWidth>
            {status === 'submitting' ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}

      <p className="mt-4 text-center text-sm">
        <Link href="/admin/login" className="font-semibold text-teal-deep underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}

export default function AdminForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <AdminForgotPasswordForm />
    </div>
  );
}
