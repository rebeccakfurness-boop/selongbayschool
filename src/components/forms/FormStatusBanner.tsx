import type { SubmitStatus } from '@/lib/useFormSubmit';

export default function FormStatusBanner({
  status,
  errorMessage,
  successMessage,
}: {
  status: SubmitStatus;
  errorMessage?: string | null;
  successMessage: string;
}) {
  if (status === 'success') {
    return (
      <div role="status" className="rounded-md border border-teal/30 bg-aqua/50 px-5 py-4 text-[15px] font-semibold text-teal-deep">
        {successMessage}
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div role="alert" className="rounded-md border border-orange-deep/40 bg-orange/10 px-5 py-4 text-[15px] font-semibold text-orange-deep">
        {errorMessage || 'Something went wrong. Please try again or email us directly.'}
      </div>
    );
  }
  return null;
}
