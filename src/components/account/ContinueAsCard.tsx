import Image from 'next/image';

/** Pure server-rendered markup, no client JS — "Continue" and "Not you?" are plain links to
 * Route Handlers, so this renders and is interactive before any JS bundle even loads. Shown
 * instead of silently logging a remembered device straight in, specifically so a shared family
 * or classroom computer can't have one person's trusted login quietly used for someone else who
 * only meant to enter their own details. */
export default function ContinueAsCard({
  title,
  label,
  continueHref,
  forgetHref,
}: {
  title: string;
  label: string;
  continueHref: string;
  forgetHref: string;
}) {
  return (
    <div className="w-full max-w-sm rounded-md border border-sand-line bg-paper p-8 shadow-soft">
      <div className="mb-5 flex justify-center rounded-md bg-teal py-5">
        <Image src="/images/logo-full.png" alt="Selong Bay School" width={378} height={299} className="h-20 w-auto" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Continue as <span className="font-semibold text-ink">{label}</span>?
      </p>
      <a
        href={continueHref}
        className="mt-6 block w-full rounded-full bg-teal px-5 py-3 text-center text-sm font-bold text-white hover:bg-teal-deep"
      >
        Continue as {label}
      </a>
      <a href={forgetHref} className="mt-4 block text-center text-sm font-semibold text-teal-deep hover:underline">
        Not you? Log in with something else
      </a>
    </div>
  );
}
