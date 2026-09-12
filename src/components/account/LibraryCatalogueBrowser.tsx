'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export interface BrowseItem {
  id: number;
  item_type: 'book' | 'toy' | 'sports_equipment' | 'other';
  title: string;
  author: string | null;
  category: string | null;
  description: string | null;
  photo_url: string | null;
  available_copies: number;
  waitlist_count: number;
}

export interface BrowseReservation {
  id: number;
  item_id: number;
  item_title: string;
  child_full_name: string;
  status: 'pending_pickup' | 'waitlisted';
  queue_position: number | null;
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  book: 'Book',
  toy: 'Toy',
  sports_equipment: 'Sports equipment',
  other: 'Other',
};

const selectClasses = 'rounded-sm border border-sand-line bg-white px-3 py-2 text-sm text-ink';

function ReservationRow({ reservation }: { reservation: BrowseReservation }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/library/reservations/${reservation.id}/cancel`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not cancel this reservation.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel this reservation.');
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand-line/60 py-2.5 last:border-0">
      <div>
        <span className="font-semibold text-ink">{reservation.item_title}</span>
        <span className="text-sm text-ink-soft"> for {reservation.child_full_name}</span>
      </div>
      <div className="flex items-center gap-3">
        {reservation.status === 'pending_pickup' ? (
          <span className="rounded-full bg-teal/15 px-2 py-0.5 text-xs font-bold text-teal-deep">Ready for pickup</span>
        ) : (
          <span className="rounded-full bg-orange/20 px-2 py-0.5 text-xs font-bold text-orange-deep">
            Waitlist{reservation.queue_position ? ` #${reservation.queue_position}` : ''}
          </span>
        )}
        <button type="button" onClick={cancel} disabled={busy} className="text-xs font-semibold text-ink-soft hover:underline disabled:opacity-50">
          Cancel
        </button>
      </div>
      {error && <p className="w-full text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}

function CatalogueItemRow({
  item,
  childOptions,
  canReserve,
}: {
  item: BrowseItem;
  childOptions: { id: number; label: string }[];
  canReserve: boolean;
}) {
  const router = useRouter();
  const [childId, setChildId] = useState(childOptions[0]?.id ? String(childOptions[0].id) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function reserve() {
    if (!childId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/account/library/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, childId: Number(childId) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not reserve this item.');
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reserve this item.');
    } finally {
      setBusy(false);
    }
  }

  const available = item.available_copies > 0;

  return (
    <div className="flex gap-4 border-b border-sand-line/60 py-4 last:border-0">
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-sm border border-sand-line bg-sand/30">
        {item.photo_url ? (
          <Image src={item.photo_url} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-ink-soft">No photo</div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <span className="font-semibold text-ink">{item.title}</span>
            {item.author && <span className="text-sm text-ink-soft"> by {item.author}</span>}
          </div>
          <span className="rounded-full bg-aqua/50 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-teal-deep">
            {ITEM_TYPE_LABELS[item.item_type]}
          </span>
        </div>
        {item.category && <p className="mt-0.5 text-xs text-ink-soft">{item.category}</p>}
        {item.description && <p className="mt-1.5 text-sm text-ink-soft">{item.description}</p>}

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className={`text-xs font-semibold ${available ? 'text-teal-deep' : 'text-orange-deep'}`}>
            {available
              ? `${item.available_copies} available`
              : item.waitlist_count > 0
                ? `On loan — ${item.waitlist_count} on the waitlist`
                : 'On loan'}
          </span>

          {done ? (
            <span className="text-xs font-semibold text-teal-deep">{available ? 'Reserved!' : 'Added to waitlist!'}</span>
          ) : canReserve ? (
            <>
              {childOptions.length > 1 && (
                <select value={childId} onChange={(e) => setChildId(e.target.value)} className={selectClasses}>
                  {childOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={reserve}
                disabled={busy || !childId}
                className="rounded-full bg-teal px-3 py-1 text-xs font-bold text-white hover:bg-teal-deep disabled:opacity-50"
              >
                {busy ? 'Requesting…' : available ? 'Reserve for pickup' : 'Join waitlist'}
              </button>
            </>
          ) : null}
        </div>
        {error && <p className="mt-1 text-xs font-semibold text-orange-deep">{error}</p>}
      </div>
    </div>
  );
}

export default function LibraryCatalogueBrowser({
  items,
  childOptions,
  reservations,
  canReserve,
}: {
  items: BrowseItem[];
  childOptions: { id: number; label: string }[];
  reservations: BrowseReservation[];
  canReserve: boolean;
}) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (type !== 'all' && item.item_type !== type) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.author?.toLowerCase().includes(q) ?? false) ||
        (item.category?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [items, query, type]);

  return (
    <div>
      {reservations.length > 0 && (
        <div className="mb-6 rounded-md border border-sand-line bg-paper p-5 shadow-soft">
          <h3 className="font-display text-base font-semibold text-ink">My reservations</h3>
          <div className="mt-2">
            {reservations.map((r) => (
              <ReservationRow key={r.id} reservation={r} />
            ))}
          </div>
        </div>
      )}

      {!canReserve && (
        <p className="mb-3 rounded-sm bg-orange/10 px-3 py-2 text-xs font-semibold text-orange-deep">
          Join the library above to reserve items — you can still browse the catalogue.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author or category…"
          className="min-w-[220px] flex-1 rounded-sm border border-sand-line bg-white px-4 py-2.5 text-[15px] text-ink placeholder:text-ink-soft/50"
        />
        <select value={type} onChange={(e) => setType(e.target.value)} className={selectClasses}>
          <option value="all">All types</option>
          <option value="book">Books</option>
          <option value="toy">Toys</option>
          <option value="sports_equipment">Sports equipment</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="mt-4 rounded-md border border-sand-line bg-paper px-5">
        {filtered.map((item) => (
          <CatalogueItemRow key={item.id} item={item} childOptions={childOptions} canReserve={canReserve} />
        ))}
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-ink-soft">No items match your search.</p>}
      </div>
    </div>
  );
}
