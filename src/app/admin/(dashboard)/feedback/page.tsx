import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getAllFeedback } from '@/lib/parent-feedback';
import ParentFeedbackManager from '@/components/admin/ParentFeedbackManager';

export const dynamic = 'force-dynamic';

export default async function AdminFeedbackPage() {
  await requireAdmin();
  await ensureSchema();
  const feedback = await getAllFeedback();

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Parent Feedback</h1>
      <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
        Concerns parents have reported through the portal — from the topics in our policy documents (child
        safety, safeguarding, behavior) to anything else. Urgent items are highlighted at the top.
      </p>
      <div className="mt-6">
        <ParentFeedbackManager initial={feedback} />
      </div>
    </section>
  );
}
