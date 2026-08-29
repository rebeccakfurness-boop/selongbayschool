import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { ensureSchema } from '@/lib/db';
import { getChildrenForGuardian } from '@/lib/lms-data';
import { getFeedbackForCustomer, type ParentFeedbackRow } from '@/lib/parent-feedback';
import AccountNav from '@/components/account/AccountNav';
import FeedbackForm from '@/components/account/FeedbackForm';

export const dynamic = 'force-dynamic';

function FeedbackLoadError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-ink">Report a Concern</h1>
      <div className="mt-6 rounded-md border border-orange-deep/40 bg-orange/10 p-5">
        <p className="font-semibold text-orange-deep">This page couldn&apos;t load.</p>
        <p className="mt-2 text-sm text-ink-soft">Please share this message with the school office so it can be fixed:</p>
        <pre className="mt-3 overflow-x-auto rounded-sm bg-ink/5 p-3 text-xs text-ink">{message}</pre>
      </div>
    </div>
  );
}

export default async function AccountFeedbackPage() {
  try {
    const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
    const customerId = session.customerId;

    await ensureSchema();
    const [children, history] = customerId
      ? await Promise.all([getChildrenForGuardian(customerId), getFeedbackForCustomer(customerId)])
      : [[], [] as ParentFeedbackRow[]];

    return renderFeedbackPage(
      children.map((c) => ({ id: c.id, label: c.child_nickname || c.child_full_name })),
      history
    );
  } catch (error) {
    console.error('[account/feedback] failed to load', error);
    return <FeedbackLoadError error={error} />;
  }
}

function renderFeedbackPage(childOptions: { id: number; label: string }[], history: ParentFeedbackRow[]) {
  return (
    <div className="min-h-screen bg-cream">
      <AccountNav active="/account/feedback" />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Report a Concern</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Something not sitting right? Tell us — this covers everything from the topics in our{' '}
          <a href="/account/policies" className="font-semibold text-teal-deep underline">
            school policies
          </a>{' '}
          (child safety, safeguarding, behavior, and more) to anything else on your mind.
        </p>

        <div className="mt-8">
          <FeedbackForm childOptions={childOptions} initial={history} />
        </div>
      </div>
    </div>
  );
}
