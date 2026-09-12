'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { EMPLOYMENT_STATUS_LEGEND, EMPLOYMENT_STATUS_ORDER, type EmploymentStatus } from '@/lib/staff-data';
import { isActiveEmploymentStatus } from '@/lib/staff-lifecycle-shared';
import { formatDate } from '@/lib/admin-format';
import type { StaffBoardRow } from '@/lib/staff-hr';

/** Mirrors FamilyBoard.tsx exactly (same @dnd-kit pattern, same Column/Card structure, same
 * optimistic-update-then-PATCH-then-revert-on-failure drag handler) -- simpler than the Family
 * Board in two ways: no synthetic extra column (employment_status alone drives which of the 5
 * columns a card sits in, no separate is_active overlay -- see the schema comment on
 * admin_users.employment_status), and no class-band sub-grouping or compliance/invoice badges
 * (those are child-specific concepts with no staff equivalent). */

function StaffCard({ staff, draggable }: { staff: StaffBoardRow; draggable: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: staff.id,
    disabled: !draggable,
  });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? { ...attributes, ...listeners } : {})}
      className={`rounded-md border border-sand-line bg-paper p-3 shadow-soft ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/admin/staff/${staff.id}`}
          onPointerDown={(e) => e.stopPropagation()}
          className="font-display text-base font-semibold text-ink underline-offset-2 hover:underline"
        >
          {staff.display_name || staff.email}
        </Link>
        {!staff.is_active && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink-soft">Login disabled</span>}
      </div>
      <div className="mt-1 text-xs text-ink-soft">{staff.position_title || (staff.role === 'teacher' ? 'Teacher' : 'Admin')}</div>
      {staff.assigned_classes.length > 0 && <div className="mt-1 text-xs text-ink-soft">{staff.assigned_classes.join(', ')}</div>}
      {staff.start_date && <div className="mt-2 text-[11px] text-ink-soft">Started {formatDate(staff.start_date)}</div>}
    </div>
  );
}

function Column({
  columnId,
  roster,
  draggable = true,
  searching = false,
}: {
  columnId: EmploymentStatus;
  roster: StaffBoardRow[];
  draggable?: boolean;
  searching?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const label = EMPLOYMENT_STATUS_LEGEND[columnId].label;

  return (
    <div
      ref={setNodeRef}
      className={`flex w-[220px] shrink-0 flex-col gap-3 rounded-md border p-3 transition-colors ${
        isOver ? 'border-teal bg-teal/10' : 'border-sand-line bg-sand/20'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</span>
        <span className="text-xs font-bold text-ink-soft">{roster.length}</span>
      </div>
      {roster.map((staff) => (
        <StaffCard key={staff.id} staff={staff} draggable={draggable} />
      ))}
      {roster.length === 0 && (
        <div className="rounded-md border border-dashed border-sand-line p-3 text-center text-xs text-ink-soft">
          {searching ? 'No matches' : 'Drop here'}
        </div>
      )}
    </div>
  );
}

function matchesSearch(staff: StaffBoardRow, query: string): boolean {
  const haystacks = [staff.display_name, staff.email, staff.position_title, ...staff.assigned_classes];
  return haystacks.some((h) => h?.toLowerCase().includes(query));
}

export default function StaffBoard({ initialStaff, canEdit }: { initialStaff: StaffBoardRow[]; canEdit: boolean }) {
  const [staffList, setStaffList] = useState(initialStaff);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const normalizedQuery = query.trim().toLowerCase();
  const searching = normalizedQuery.length > 0;
  const visibleStaff = searching ? staffList.filter((s) => matchesSearch(s, normalizedQuery)) : staffList;

  const byColumn = new Map<EmploymentStatus, StaffBoardRow[]>(EMPLOYMENT_STATUS_ORDER.map((c) => [c, []]));
  for (const s of visibleStaff) byColumn.get(s.employment_status)?.push(s);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const newColumn = over.id as EmploymentStatus;
    const staffId = active.id as number;
    const current = staffList.find((s) => s.id === staffId);
    if (!current) return;
    if (current.employment_status === newColumn) return;

    // Client-side guard rail mirroring FamilyBoard's own: same rule the API enforces
    // (checkActiveEmploymentGuardRail), just so the admin sees why immediately.
    if (isActiveEmploymentStatus(newColumn) && !current.start_date) {
      setError(`${current.display_name || current.email}: set a start date first (Edit on the Staff Card).`);
      return;
    }

    setError(null);
    setStaffList((prev) => prev.map((s) => (s.id === staffId ? { ...s, employment_status: newColumn } : s)));

    try {
      const res = await fetch(`/api/admin/staff/${staffId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newColumn }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that move. Reverted.');
      setStaffList((prev) => prev.map((s) => (s.id === staffId ? { ...s, employment_status: current.employment_status } : s)));
    }
  }

  const searchBox = (
    <div className="mb-4 flex items-center gap-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, position, or class…"
        aria-label="Search staff"
        className="w-full max-w-sm rounded-full border border-sand-line bg-paper px-4 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-teal focus:outline-none"
      />
      {searching && (
        <span className="text-xs font-semibold text-ink-soft">
          {visibleStaff.length} match{visibleStaff.length === 1 ? '' : 'es'}
        </span>
      )}
    </div>
  );

  if (!canEdit) {
    return (
      <div>
        {searchBox}
        <div className="flex gap-5 overflow-x-auto pb-2">
          {EMPLOYMENT_STATUS_ORDER.map((columnId) => (
            <Column key={columnId} columnId={columnId} roster={byColumn.get(columnId) || []} draggable={false} searching={searching} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {searchBox}
      {error && <p className="mb-3 text-sm font-semibold text-orange-deep">{error}</p>}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-5 overflow-x-auto pb-2">
          {EMPLOYMENT_STATUS_ORDER.map((columnId) => (
            <Column key={columnId} columnId={columnId} roster={byColumn.get(columnId) || []} searching={searching} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
