'use client';

import Image from 'next/image';
import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import { useFormSubmit } from '@/lib/useFormSubmit';

function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get('next') || '/student';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { status, errorMessage, submit } = useFormSubmit<{ ok: true }>('/api/student/login');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await submit({ username, password });
    if (result) {
      router.push(next);
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-sm rounded-md border border-sand-line bg-paper p-8 shadow-soft">
      <div className="mb-5 flex justify-center rounded-md bg-teal py-5">
        <Image src="/images/logo-full.png" alt="Selong Bay School" width={378} height={299} className="h-20 w-auto" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-ink">Student Login</h1>
      <p className="mt-1 text-sm text-ink-soft">Ask your teacher if you don&apos;t have a username and password yet.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <Field label="Username" htmlFor="student-login-username" required>
          <TextInput
            id="student-login-username"
            required
            autoFocus
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="student-login-password" required>
          <TextInput
            id="student-login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {status === 'error' && <p role="alert" className="text-sm font-semibold text-orange-deep">{errorMessage}</p>}
        <Button type="submit" variant="primary" disabled={status === 'submitting'} fullWidth>
          {status === 'submitting' ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </div>
  );
}

export default function StudentLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 py-12">
      <Suspense fallback={null}>
        <StudentLoginForm />
      </Suspense>
    </div>
  );
}
