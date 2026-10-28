import SendLombokGuideButton from '@/components/admin/SendLombokGuideButton';

export default function LombokGuideSection({ childFullName, canEdit, defaultEmail }: { childFullName: string; canEdit: boolean; defaultEmail: string }) {
  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">Lombok Guide</h3>
        {canEdit && <SendLombokGuideButton childFullName={childFullName} defaultEmail={defaultEmail} />}
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        Car rentals, local attractions, activities, where to buy food, medical services, real estate agents, and more --
        everything a new family needs settling into Selong Belanak, as a PDF.
      </p>
    </div>
  );
}
