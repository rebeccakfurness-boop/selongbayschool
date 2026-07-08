import Link from 'next/link';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'accent' | 'ghost';

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-teal text-white shadow-[0_10px_24px_-10px_rgba(0,124,131,0.55)] hover:bg-teal-deep',
  accent:
    'bg-orange text-[#46280a] shadow-[0_10px_24px_-10px_rgba(254,167,74,0.6)] hover:bg-orange-deep hover:text-white',
  ghost: 'bg-transparent text-teal-deep border-2 border-teal hover:bg-teal hover:text-white',
};

export default function Button({
  href,
  variant = 'primary',
  children,
  className = '',
  type,
  onClick,
  disabled,
  fullWidth,
  external,
}: {
  href?: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  external?: boolean;
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-sans font-extrabold text-[15.5px] px-7 py-3.5 transition-transform duration-150 ease-out hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-lightteal focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none ${
    variantClasses[variant]
  } ${fullWidth ? 'w-full' : ''} ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </Link>
    );
  }

  return (
    <button type={type ?? 'button'} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
