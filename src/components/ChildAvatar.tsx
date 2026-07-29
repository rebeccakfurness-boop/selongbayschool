const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-base',
  lg: 'h-20 w-20 text-2xl',
} as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

/** Circular avatar shown everywhere a child's name appears (family board tile, Child Card header,
 * teacher view — same component — and the parent portal). Plain <img>, not next/image: this is a
 * small fixed-size thumbnail sourced from arbitrary Vercel Blob URLs, so the extra remote-pattern
 * config and layout-shift machinery next/image brings isn't worth it here. */
export default function ChildAvatar({
  photoUrl,
  name,
  size = 'md',
  className = '',
}: {
  photoUrl: string | null | undefined;
  name: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  const sizeClasses = SIZE_CLASSES[size];
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeClasses} flex-shrink-0 rounded-full border border-sand-line object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`${sizeClasses} flex flex-shrink-0 items-center justify-center rounded-full border border-sand-line bg-teal/15 font-display font-semibold text-teal-deep ${className}`}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}
