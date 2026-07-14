export default function StatusPill({ status }: { status: string }) {
  const sent = status === 'sent';
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
        sent ? 'bg-teal/15 text-teal-deep' : 'bg-orange/20 text-orange-deep'
      }`}
    >
      {sent ? 'Email sent' : 'Email failed'}
    </span>
  );
}
