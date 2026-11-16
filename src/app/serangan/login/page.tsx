import SeranganLoginForm from '@/components/serangan/SeranganLoginForm';

export const dynamic = 'force-dynamic';

export default function SeranganLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <SeranganLoginForm />
    </div>
  );
}
