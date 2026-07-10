import type { Metadata } from 'next';
import Button from '@/components/Button';

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to the Selong Bay School parent or student portal.',
  openGraph: { title: 'Log In - Selong Bay School' },
};

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center md:px-8 md:py-28">
      <p className="font-script text-3xl text-orange-deep md:text-4xl">Welcome back</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Log In</h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
        Parent and student portals are coming soon. Once available, you&apos;ll be able to log in below.
      </p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-4">
        <Button href="#" variant="primary" fullWidth>
          Parent Login
        </Button>
        <Button href="#" variant="ghost" fullWidth>
          Student Login
        </Button>
      </div>
    </div>
  );
}
