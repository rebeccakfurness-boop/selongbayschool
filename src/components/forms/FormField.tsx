import type { ReactNode } from 'react';

export function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="font-sans text-sm font-bold text-ink">
        {label} {required && <span className="text-orange-deep">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClasses =
  'rounded-sm border border-sand-line bg-white px-4 py-2.5 font-sans text-[15px] text-ink placeholder:text-ink-soft/50 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClasses} ${props.className ?? ''}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClasses} ${props.className ?? ''}`} />;
}

export function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function WordCount({ value, max }: { value: string; max: number }) {
  const count = countWords(value);
  return (
    <span className={`self-end text-xs font-semibold ${count > max ? 'text-orange-deep' : 'text-ink-soft/70'}`}>
      {count} / {max} words
    </span>
  );
}
