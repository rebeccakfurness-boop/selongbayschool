import { ensureSchema } from '@/lib/db';
import { getSchoolPolicies, type SchoolPolicyRow } from '@/lib/policies';
import { formatDate } from '@/lib/admin-format';
import AccountNav from '@/components/account/AccountNav';

export const dynamic = 'force-dynamic';

function PoliciesLoadError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-ink">Policies</h1>
      <div className="mt-6 rounded-md border border-orange-deep/40 bg-orange/10 p-5">
        <p className="font-semibold text-orange-deep">This page couldn&apos;t load.</p>
        <p className="mt-2 text-sm text-ink-soft">Please share this message with the school office so it can be fixed:</p>
        <pre className="mt-3 overflow-x-auto rounded-sm bg-ink/5 p-3 text-xs text-ink">{message}</pre>
      </div>
    </div>
  );
}

export default async function AccountPoliciesPage() {
  try {
    await ensureSchema();
    const policies = await getSchoolPolicies();
    return renderPoliciesPage(policies);
  } catch (error) {
    console.error('[account/policies] failed to load', error);
    return <PoliciesLoadError error={error} />;
  }
}

function renderPoliciesPage(policies: SchoolPolicyRow[]) {
  return (
    <div className="min-h-screen bg-cream">
      <AccountNav active="/account/policies" />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">School Policies</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Current school policy documents. Each one opens in a new tab.
        </p>

        {policies.length === 0 && (
          <div className="mt-8 rounded-md border border-dashed border-sand-line bg-paper p-8 text-center">
            <p className="text-ink-soft">No policy documents have been posted yet.</p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {policies.map((p) => (
            <a
              key={p.id}
              href={p.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-4 rounded-md border border-sand-line bg-paper p-5 shadow-soft transition-colors hover:border-teal-deep"
            >
              <div>
                <p className="font-display text-base font-semibold text-teal-deep underline">{p.title}</p>
                {p.description && <p className="mt-1.5 text-sm text-ink-soft">{p.description}</p>}
              </div>
              <span className="shrink-0 text-xs text-ink-soft">{formatDate(p.created_at)}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
