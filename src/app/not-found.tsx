import Button from '@/components/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-script text-4xl text-orange-deep">Lost the trail?</p>
      <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">We couldn&apos;t find that page</h1>
      <p className="max-w-md text-[16px] text-ink-soft">
        The page you&apos;re looking for may have moved. Try the homepage, or get in touch if you were expecting something
        specific.
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <Button href="/" variant="primary">
          Back to homepage
        </Button>
        <Button href="/contact" variant="ghost">
          Contact us
        </Button>
      </div>
    </div>
  );
}
