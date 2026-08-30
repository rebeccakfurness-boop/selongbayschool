'use client';

export default function PrintButton({ label = 'Print' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded-full bg-teal px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-deep"
    >
      {label}
    </button>
  );
}
