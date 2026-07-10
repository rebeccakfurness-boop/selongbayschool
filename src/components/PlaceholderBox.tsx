export function PlaceholderImage({ label = 'Photo coming soon', className = 'h-64' }: { label?: string; className?: string }) {
  return (
    <div
      className={`flex w-full items-center justify-center rounded-md border-2 border-dashed border-sand-line bg-sand/20 px-6 text-center text-sm font-semibold text-ink-soft ${className}`}
    >
      {label}
    </div>
  );
}

export function PlaceholderText({ label = 'Content coming soon' }: { label?: string }) {
  return (
    <div className="rounded-md border-2 border-dashed border-sand-line bg-sand/20 px-6 py-8 text-center text-sm font-semibold italic text-ink-soft">
      {label}
    </div>
  );
}
