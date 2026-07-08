'use client';

import { useEffect } from 'react';
import Button from '@/components/Button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app] unhandled error', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-script text-4xl text-orange-deep">Oops</p>
      <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">Something went wrong</h1>
      <p className="max-w-md text-[16px] text-ink-soft">
        We&apos;ve hit an unexpected error. Please try again, or contact us directly if the problem continues.
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset} variant="primary">
          Try again
        </Button>
        <Button href="/contact" variant="ghost">
          Contact us
        </Button>
      </div>
    </div>
  );
}
