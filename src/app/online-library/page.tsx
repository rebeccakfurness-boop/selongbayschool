import type { Metadata } from 'next';
import Button from '@/components/Button';

export const metadata: Metadata = {
  title: 'Online Library',
  description: 'Access the Selong Bay School digital library, powered by Libby, from any device.',
  openGraph: { title: 'Online Library - Selong Bay School' },
};

export default function OnlineLibraryPage() {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center md:px-8 md:py-28">
      <p className="font-script text-3xl text-orange-deep md:text-4xl">For our students and families</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">Online Library</h1>
      <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft">
        Every Selong Bay student has 24/7 access to thousands of ebooks and audiobooks through Libby, our digital library
        partner. Read, listen, and discover from any device, wherever you are in the world.
      </p>

      <div className="mt-8 w-full max-w-md rounded-lg border border-sand-line bg-paper p-8 shadow-soft">
        <h2 className="font-display text-xl font-semibold text-ink">Open Libby</h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
          Libby opens in a new tab. Sign in with your Selong Bay School library card details to start borrowing.
        </p>
        <Button href="https://libbyapp.com/" variant="primary" fullWidth className="mt-5" external>
          Launch Libby
        </Button>
      </div>

      <p className="mt-6 max-w-md text-sm text-ink-soft">
        Need your library card details, or have trouble signing in? Contact us at{' '}
        <a href="mailto:hello@selongbayschool.com" className="font-semibold text-teal-deep underline">
          hello@selongbayschool.com
        </a>
        .
      </p>
    </div>
  );
}
