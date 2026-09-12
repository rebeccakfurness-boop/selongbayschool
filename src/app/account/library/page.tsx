import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { ensureSchema } from '@/lib/db';
import { getChildrenForGuardian } from '@/lib/lms-data';
import {
  getMembershipForCustomer,
  getLoansForChildren,
  getLibrarySettings,
  effectiveMonthlyFee,
  getBrowsableLibraryItems,
  getReservationsForCustomer,
  type LibraryMembership,
  type LibraryLoanRow,
  type LibrarySettings,
} from '@/lib/library';
import { formatIDR } from '@/lib/site-content';
import { formatDate } from '@/lib/admin-format';
import AccountNav from '@/components/account/AccountNav';
import JoinLibraryButton from '@/components/account/JoinLibraryButton';
import RedeemLibraryCodeForm from '@/components/account/RedeemLibraryCodeForm';
import CancelLibraryMembershipButton from '@/components/account/CancelLibraryMembershipButton';
import LibraryCatalogueBrowser, { type BrowseItem, type BrowseReservation } from '@/components/account/LibraryCatalogueBrowser';

export const dynamic = 'force-dynamic';

function OverviewLoadError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-ink">Library</h1>
      <div className="mt-6 rounded-md border border-orange-deep/40 bg-orange/10 p-5">
        <p className="font-semibold text-orange-deep">This page couldn&apos;t load.</p>
        <p className="mt-2 text-sm text-ink-soft">Please share this message with the school office so it can be fixed:</p>
        <pre className="mt-3 overflow-x-auto rounded-sm bg-ink/5 p-3 text-xs text-ink">{message}</pre>
      </div>
    </div>
  );
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  book: 'Book',
  toy: 'Toy',
  sports_equipment: 'Sports equipment',
  other: 'Other',
};

export default async function AccountLibraryPage() {
  try {
    const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
    const customerId = session.customerId;

    await ensureSchema();
    const kids = customerId ? await getChildrenForGuardian(customerId) : [];
    const membership = customerId ? await getMembershipForCustomer(customerId) : null;
    const settings = await getLibrarySettings();
    const loans = await getLoansForChildren(kids.map((k) => k.id));
    const catalogueItems = await getBrowsableLibraryItems();
    const reservations = (customerId ? await getReservationsForCustomer(customerId) : []) as unknown as BrowseReservation[];
    const childOptions = kids.map((k) => ({ id: k.id, label: k.child_nickname || k.child_full_name }));

    return renderLibraryPage({
      kidsCount: kids.length,
      childOptions,
      membership,
      settings,
      loans,
      catalogueItems,
      reservations,
    });
  } catch (error) {
    console.error('[account/library] failed to load', error);
    return <OverviewLoadError error={error} />;
  }
}

function renderLibraryPage({
  kidsCount,
  childOptions,
  membership,
  settings,
  loans,
  catalogueItems,
  reservations,
}: {
  kidsCount: number;
  childOptions: { id: number; label: string }[];
  membership: LibraryMembership | null;
  settings: LibrarySettings;
  loans: LibraryLoanRow[];
  catalogueItems: BrowseItem[];
  reservations: BrowseReservation[];
}) {
  const activeLoans = loans.filter((l) => !l.returned_at);
  const pastLoans = loans.filter((l) => l.returned_at);
  const overdueCount = activeLoans.filter((l) => l.days_overdue > 0).length;
  const isMember = membership?.status === 'active';

  return (
    <div>
      <AccountNav active="/account/library" />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Library</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Books, toys and sports equipment on loan from the school library — membership, due dates and fees for your family.
        </p>

        <div className="mt-6 rounded-md border border-sand-line bg-paper p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Membership</h2>
              {isMember && membership ? (
                <p className="mt-1 text-sm text-ink-soft">
                  Active — <span className="font-semibold text-ink">{formatIDR(effectiveMonthlyFee(membership))}</span> / month
                  {membership.discount_percent > 0 && (
                    <span className="ml-1 rounded-full bg-teal/15 px-2 py-0.5 text-xs font-bold text-teal-deep">
                      {membership.discount_percent}% off applied
                    </span>
                  )}
                  , billed on top of school fees.
                </p>
              ) : (
                <p className="mt-1 text-sm text-ink-soft">
                  Not a member yet — join for {formatIDR(settings.monthly_membership_fee_idr)} / month to borrow books, toys and sports
                  equipment for {kidsCount > 0 ? 'your children' : 'your family'}.
                </p>
              )}
            </div>
            {isMember ? <CancelLibraryMembershipButton /> : <JoinLibraryButton />}
          </div>

          <div className="mt-5 border-t border-sand-line pt-4">
            <p className="text-sm font-bold text-ink">Have a discount code?</p>
            <p className="mt-1 text-xs text-ink-soft">Long-term families may be given a code for free or discounted access.</p>
            <div className="mt-2">
              <RedeemLibraryCodeForm />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold text-ink">Browse the catalogue</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Search what&apos;s on the shelves. Reserve an available item for pickup, or join the waitlist if every copy is out.
          </p>
          <div className="mt-3">
            <LibraryCatalogueBrowser
              items={catalogueItems}
              childOptions={childOptions}
              reservations={reservations}
              canReserve={isMember && childOptions.length > 0}
            />
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold text-ink">
            Currently borrowed {activeLoans.length > 0 && `(${activeLoans.length})`}
          </h2>
          {overdueCount > 0 && (
            <p className="mt-1 text-sm font-semibold text-orange-deep">
              {overdueCount} item{overdueCount > 1 ? 's are' : ' is'} overdue — a late fee is accruing.
            </p>
          )}
          <div className="mt-3 overflow-x-auto rounded-md border border-sand-line bg-paper">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-sand-line bg-sand/40 text-left">
                  <th className="px-4 py-3 font-bold text-ink-soft">Item</th>
                  <th className="px-4 py-3 font-bold text-ink-soft">Borrower</th>
                  <th className="px-4 py-3 font-bold text-ink-soft">Borrowed</th>
                  <th className="px-4 py-3 font-bold text-ink-soft">Due back</th>
                  <th className="px-4 py-3 font-bold text-ink-soft">Late fee</th>
                </tr>
              </thead>
              <tbody>
                {activeLoans.map((loan) => {
                  const overdue = loan.days_overdue > 0;
                  return (
                    <tr key={loan.id} className="border-b border-sand-line/60 last:border-0 align-top">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink">{loan.item_title}</div>
                        <div className="text-xs text-ink-soft">{ITEM_TYPE_LABELS[loan.item_type]}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{loan.child_full_name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(loan.borrowed_at)}</td>
                      <td className={`whitespace-nowrap px-4 py-3 font-semibold ${overdue ? 'text-orange-deep' : 'text-ink'}`}>
                        {formatDate(loan.due_date)}
                        {overdue && <span className="ml-1.5 rounded-full bg-orange/20 px-2 py-0.5 text-xs font-bold">{loan.days_overdue}d overdue</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                        {overdue ? formatIDR(loan.estimated_late_fee_idr) : '—'}
                      </td>
                    </tr>
                  );
                })}
                {activeLoans.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-ink-soft">Nothing currently on loan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {pastLoans.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-lg font-semibold text-ink">Loan history</h2>
            <div className="mt-3 overflow-x-auto rounded-md border border-sand-line bg-paper">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-sand-line bg-sand/40 text-left">
                    <th className="px-4 py-3 font-bold text-ink-soft">Item</th>
                    <th className="px-4 py-3 font-bold text-ink-soft">Borrower</th>
                    <th className="px-4 py-3 font-bold text-ink-soft">Returned</th>
                    <th className="px-4 py-3 font-bold text-ink-soft">Late fee</th>
                  </tr>
                </thead>
                <tbody>
                  {pastLoans.map((loan) => (
                    <tr key={loan.id} className="border-b border-sand-line/60 last:border-0 align-top">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink">{loan.item_title}</div>
                        <div className="text-xs text-ink-soft">{ITEM_TYPE_LABELS[loan.item_type]}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{loan.child_full_name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(loan.returned_at!)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                        {loan.late_fee_waived ? (
                          <span className="text-teal-deep">Waived</span>
                        ) : loan.estimated_late_fee_idr > 0 ? (
                          formatIDR(loan.estimated_late_fee_idr)
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
