import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { getAllReservations } from '@/lib/library';
import { formatDateTime } from '@/lib/admin-format';
import LibrarySubNav from '@/components/admin/LibrarySubNav';
import LibraryReservationActions from '@/components/admin/LibraryReservationActions';

export const dynamic = 'force-dynamic';

const ITEM_TYPE_LABELS: Record<string, string> = {
  book: 'Book',
  toy: 'Toy',
  sports_equipment: 'Sports equipment',
  other: 'Other',
};

export default async function AdminLibraryReservationsPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const reservations = await getAllReservations();
  const readyCount = reservations.filter((r) => r.status === 'pending_pickup').length;
  const waitlistedCount = reservations.filter((r) => r.status === 'waitlisted').length;

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Library Reservations</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {readyCount} ready for pickup · {waitlistedCount} on a waitlist.
      </p>
      <LibrarySubNav active="/admin/library/reservations" isAdmin={staff.role === 'admin'} />

      <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">Item</th>
              <th className="px-4 py-3 font-bold text-ink-soft">For</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Family</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Requested</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Status</th>
              <th className="px-4 py-3 font-bold text-ink-soft"></th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.id} className="border-b border-sand-line/60 last:border-0 align-top">
                <td className="px-4 py-3">
                  <div className="font-semibold text-ink">{r.item_title}</div>
                  <div className="text-xs text-ink-soft">{ITEM_TYPE_LABELS[r.item_type]}</div>
                </td>
                <td className="px-4 py-3 text-ink-soft">{r.child_full_name}</td>
                <td className="px-4 py-3">
                  <div className="text-ink">{r.customer_name || r.customer_email}</div>
                  <div className="text-xs text-ink-soft">{r.customer_email}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDateTime(r.requested_at)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {r.status === 'pending_pickup' ? (
                    <span className="rounded-full bg-teal/15 px-2 py-0.5 text-xs font-bold text-teal-deep">Ready for pickup</span>
                  ) : (
                    <span className="rounded-full bg-orange/20 px-2 py-0.5 text-xs font-bold text-orange-deep">
                      Waitlist{r.queue_position ? ` #${r.queue_position}` : ''}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <LibraryReservationActions reservationId={r.id} readyForPickup={r.status === 'pending_pickup'} />
                </td>
              </tr>
            ))}
            {reservations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-soft">No active reservations.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
