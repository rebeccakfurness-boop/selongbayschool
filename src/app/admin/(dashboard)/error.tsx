'use client';

import { useEffect } from 'react';
import Button from '@/components/Button';

/** Segment-scoped error boundary for everything under /admin — without this, an error thrown
 * anywhere in the admin layout or a client component (neither of which a page's own try/catch can
 * catch — see BoardLoadError on the Family Board page for what that DOES cover) falls all the way
 * up to the site-wide error.tsx, which renders inside the public marketing layout: admin staff see
 * the public header/footer instead of the admin sidebar, which is confusing on top of already
 * being broken. This keeps the failure visually inside the admin app. Next.js still redacts the
 * real error message here in production (same as the site-wide boundary) — error.digest below is
 * what correlates to the actual message in server logs. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[admin] unhandled error', error);
  }, [error]);

  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-2xl font-semibold text-ink">Something went wrong</h1>
      <p className="max-w-md text-[15px] text-ink-soft">
        We&apos;ve hit an unexpected error loading this page.
        {error.digest && <> Reference: <code className="text-xs">{error.digest}</code></>}
      </p>
      <Button onClick={reset} variant="primary">
        Try again
      </Button>
    </section>
  );
}
