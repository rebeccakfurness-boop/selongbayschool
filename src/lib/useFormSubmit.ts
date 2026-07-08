'use client';

import { useState } from 'react';

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export function useFormSubmit<TResponse = unknown>(endpoint: string) {
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(payload: unknown): Promise<TResponse | null> {
    setStatus('submitting');
    setErrorMessage(null);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setErrorMessage(data?.error || 'Something went wrong. Please try again or email us directly.');
        return null;
      }
      setStatus('success');
      return data as TResponse;
    } catch {
      setStatus('error');
      setErrorMessage('We could not reach the server. Please check your connection and try again.');
      return null;
    }
  }

  function reset() {
    setStatus('idle');
    setErrorMessage(null);
  }

  return { status, errorMessage, submit, reset };
}
