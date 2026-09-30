import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { ensureSchema } from '@/lib/db';
import { getChildrenForGuardian } from '@/lib/lms-data';
import { getCcaSettings, getActiveCcaActivities, getCcaPriceOverridesForChild, getCcaSelectionForChild, resolvePrice } from '@/lib/cca';
import { formatDate } from '@/lib/admin-format';
import AccountNav from '@/components/account/AccountNav';
import CcaSelectionForm, { type CcaCatalogItem } from '@/components/account/CcaSelectionForm';

export const dynamic = 'force-dynamic';

function OverviewLoadError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-ink">Co-Curricular Activities</h1>
      <div className="mt-6 rounded-md border border-orange-deep/40 bg-orange/10 p-5">
        <p className="font-semibold text-orange-deep">This page couldn&apos;t load.</p>
        <p className="mt-2 text-sm text-ink-soft">Please share this message with the school office so it can be fixed:</p>
        <pre className="mt-3 overflow-x-auto rounded-sm bg-ink/5 p-3 text-xs text-ink">{message}</pre>
      </div>
    </div>
  );
}

export default async function AccountCcaPage() {
  try {
    const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
    const customerId = session.customerId;

    await ensureSchema();
    const kids = customerId ? await getChildrenForGuardian(customerId) : [];
    const enabledKids = kids.filter((k) => k.cca_enabled);
    const settings = await getCcaSettings();
    const activities = await getActiveCcaActivities();

    const children = await Promise.all(
      enabledKids.map(async (kid) => {
        const overrides = await getCcaPriceOverridesForChild(kid.id);
        const overrideByCca = new Map(overrides.map((o) => [o.cca_id, o.price_idr]));
        const catalog: CcaCatalogItem[] = activities.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          dayOfWeek: a.day_of_week,
          resolvedPriceIdr: resolvePrice(a.default_price_idr, null, overrideByCca.get(a.id) ?? null),
          options: a.options.map((o) => ({
            id: o.id,
            name: o.name,
            resolvedPriceIdr: resolvePrice(a.default_price_idr, o.price_idr, overrideByCca.get(a.id) ?? null),
          })),
        }));
        const selection = settings.term_label ? await getCcaSelectionForChild(kid.id, settings.term_label) : null;
        return {
          id: kid.id,
          label: kid.child_nickname || kid.child_full_name,
          catalog,
          selection,
        };
      })
    );

    return renderCcaPage({ settings, children, hasAnyChildren: kids.length > 0 });
  } catch (error) {
    console.error('[account/cca] failed to load', error);
    return <OverviewLoadError error={error} />;
  }
}

function renderCcaPage({
  settings,
  children,
  hasAnyChildren,
}: {
  settings: Awaited<ReturnType<typeof getCcaSettings>>;
  children: { id: number; label: string; catalog: CcaCatalogItem[]; selection: Awaited<ReturnType<typeof getCcaSelectionForChild>> }[];
  hasAnyChildren: boolean;
}) {
  return (
    <div>
      <AccountNav active="/account/cca" />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Co-Curricular Activities</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {settings.term_label
            ? `Choose CCAs for ${settings.term_label}${settings.term_start_date && settings.term_end_date ? ` (${formatDate(settings.term_start_date)} – ${formatDate(settings.term_end_date)})` : ''}.`
            : 'CCA selections haven’t been set up for a term yet.'}
        </p>
        {settings.term_label && !settings.selection_open && (
          <p className="mt-3 rounded-md border border-orange/30 bg-orange/10 px-4 py-3 text-sm font-semibold text-orange-deep">
            Selections are currently closed.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-6">
          {children.map((child) => (
            <div key={child.id} className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold text-ink">{child.label}</h2>
              <div className="mt-4">
                <CcaSelectionForm
                  childId={child.id}
                  catalog={child.catalog}
                  existingSelection={child.selection}
                  selectionOpen={!!settings.term_label && settings.selection_open}
                />
              </div>
            </div>
          ))}
          {children.length === 0 && (
            <div className="rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft">
              {hasAnyChildren
                ? "CCA selections aren't turned on for your children yet. Ask the school office if you'd like this enabled."
                : 'No children linked to your account yet.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
