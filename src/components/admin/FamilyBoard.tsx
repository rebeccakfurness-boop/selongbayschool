'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { STATUS_LEGEND, STATUS_ORDER, CLASS_BAND_LABELS, CLASS_BAND_ORDER, type ChildStatus, type ClassBand } from '@/lib/family-data';
import { isActiveStatus, complianceBadge, invoiceBadge, type ComplianceBadge, type InvoiceBadge } from '@/lib/child-lifecycle-shared';
import { formatDate } from '@/lib/admin-format';
import ChildAvatar from '@/components/ChildAvatar';

export interface BoardChild {
  id: number;
  status: ChildStatus;
  is_active: boolean;
  class_name: string | null;
  class_band: string | null;
  programme: string | null;
  child_full_name: string;
  child_nickname: string | null;
  photo_url: string | null;
  parent1_name: string | null;
  parent2_name: string | null;
  allergies_medical_notes: string | null;
  enrolment_date: string | null;
  compliance_signed_count: number;
  compliance_out_of_date: boolean;
  latest_invoice_status: string | null;
  latest_invoice_days_overdue: number | null;
}

/** A board column is either a real status or the synthetic "inactive" column — inactive isn't a
 * ChildStatus value (it's driven by the existing is_active flag, same field the live
 * calendar/dashboard roster already filter on), it's just rendered as a 7th column so withdrawal
 * is a drag like everything else, not a hidden checkbox. */
type ColumnId = ChildStatus | 'inactive';
const COLUMN_ORDER: ColumnId[] = [...STATUS_ORDER, 'inactive'];

const COMPLIANCE_TOTAL = 7;

const COMPLIANCE_BADGE_STYLE: Record<ComplianceBadge, { label: string; className: string }> = {
  unsigned: { label: 'Unsigned', className: 'bg-orange/20 text-orange-deep' },
  signed: { label: 'Signed', className: 'bg-teal/15 text-teal-deep' },
  out_of_date: { label: 'Out of date', className: 'bg-orange-deep/20 text-orange-deep' },
};

function complianceLabel(badge: ComplianceBadge, signedCount: number): string {
  if (badge === 'unsigned') return `Compliance ${signedCount}/${COMPLIANCE_TOTAL}`;
  return `Compliance: ${COMPLIANCE_BADGE_STYLE[badge].label}`;
}

function invoiceBadgeDisplay(badge: InvoiceBadge): { label: string; className: string } {
  if (badge === 'not_generated') return { label: 'Invoice: not yet generated', className: 'bg-sand text-ink-soft' };
  if (badge === 'outstanding') return { label: 'Invoice: outstanding', className: 'bg-orange/20 text-orange-deep' };
  if (badge === 'paid') return { label: 'Invoice: paid', className: 'bg-teal/15 text-teal-deep' };
  return { label: `Invoice: ${badge.overdueDays}d overdue`, className: 'bg-orange-deep/25 text-orange-deep' };
}

/** This is purely a system-computed badge (compliance state, invoice state) — deliberately not a
 * draggable/clickable element, so nothing in the UI implies either can be changed by dragging. */
function SystemBadge({ label, className }: { label: string; className: string }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${className}`}>{label}</span>;
}

function ChildCard({ child, draggable }: { child: BoardChild; draggable: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: child.id,
    disabled: !draggable,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined;

  const compBadge = complianceBadge(child.compliance_signed_count, COMPLIANCE_TOTAL, child.compliance_out_of_date);
  const invBadge = invoiceBadge(
    child.status,
    child.latest_invoice_status ? { status: child.latest_invoice_status, days_overdue: child.latest_invoice_days_overdue ?? 0 } : null
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? { ...attributes, ...listeners } : {})}
      className={`rounded-md border border-sand-line bg-paper p-3 shadow-soft ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <ChildAvatar photoUrl={child.photo_url} name={child.child_full_name} size="sm" />
          <div>
            <Link
              href={`/admin/families/${child.id}`}
              onPointerDown={(e) => e.stopPropagation()}
              className="font-display text-base font-semibold text-ink underline-offset-2 hover:underline"
            >
              {child.child_nickname || child.child_full_name}
            </Link>
            {child.child_nickname && <div className="text-xs text-ink-soft">{child.child_full_name}</div>}
          </div>
        </div>
        {!child.is_active && (
          <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink-soft">Inactive</span>
        )}
      </div>
      <div className="mt-2 text-xs text-ink-soft">
        {child.class_name || 'No class set'}
        {child.class_band && ` · ${CLASS_BAND_LABELS[child.class_band as keyof typeof CLASS_BAND_LABELS] || child.class_band}`}
      </div>
      {(child.parent1_name || child.parent2_name) && (
        <div className="mt-1 text-xs text-ink-soft">{[child.parent1_name, child.parent2_name].filter(Boolean).join(' & ')}</div>
      )}
      {child.allergies_medical_notes && (
        <div className="mt-2 rounded-sm bg-orange/10 px-2 py-1 text-[11px] font-semibold text-orange-deep">
          ⚠ Medical/allergy note on file
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <SystemBadge label={complianceLabel(compBadge, child.compliance_signed_count)} className={COMPLIANCE_BADGE_STYLE[compBadge].className} />
        {invBadge && <SystemBadge {...invoiceBadgeDisplay(invBadge)} />}
      </div>
      {child.enrolment_date && (
        <div className="mt-2 text-[11px] text-ink-soft">Enrolled {formatDate(child.enrolment_date)}</div>
      )}
    </div>
  );
}

/** Groups a roster by class_band, in CLASS_BAND_ORDER, with any child missing a class_band
 * (never assigned one yet) collected into a trailing "No class set" group — empty bands are
 * dropped rather than shown as empty headers, so a school with no full-time Early Years student
 * just shows Kindergarten/Primary/Secondary. */
function groupByClassBand(roster: BoardChild[]): { key: string; label: string; children: BoardChild[] }[] {
  const groups = new Map<string, BoardChild[]>();
  for (const child of roster) {
    const key = child.class_band ?? 'unassigned';
    const list = groups.get(key) ?? [];
    list.push(child);
    groups.set(key, list);
  }
  const order = [...CLASS_BAND_ORDER, 'unassigned'];
  return order
    .filter((key) => groups.has(key))
    .map((key) => ({
      key,
      label: key === 'unassigned' ? 'No class set' : CLASS_BAND_LABELS[key as ClassBand],
      children: groups.get(key)!,
    }));
}

function Column({ columnId, roster, draggable = true }: { columnId: ColumnId; roster: BoardChild[]; draggable?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const label = columnId === 'inactive' ? 'Inactive' : STATUS_LEGEND[columnId].label;
  // Full Time is the one column split into Kindergarten/Primary/Secondary sub-sections — every
  // other column (enquiry, waitlist, temporary, worldschooler, hybrid, inactive) stays a flat
  // list, since those are small/mixed enough that the grouping wouldn't earn its keep.
  const bandGroups = columnId === 'full_time' ? groupByClassBand(roster) : null;

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
      {bandGroups
        ? bandGroups.map((group) => (
            <div key={group.key} className="flex flex-col gap-3">
              <div className="-mb-1 flex items-center justify-between border-t border-sand-line pt-2 first:border-t-0 first:pt-0">
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-soft/70">{group.label}</span>
                <span className="text-[10px] font-bold text-ink-soft/70">{group.children.length}</span>
              </div>
              {group.children.map((child) => (
                <ChildCard key={child.id} child={child} draggable={draggable} />
              ))}
            </div>
          ))
        : roster.map((child) => <ChildCard key={child.id} child={child} draggable={draggable} />)}
      {roster.length === 0 && (
        <div className="rounded-md border border-dashed border-sand-line p-3 text-center text-xs text-ink-soft">
          Drop here
        </div>
      )}
    </div>
  );
}

/** A card's rendered column: any inactive child shows under "Inactive" regardless of its
 * underlying status (which is preserved, not overwritten, so re-activating restores it) — an
 * active-status child shows under its own status column. */
function columnFor(child: BoardChild): ColumnId {
  return child.is_active ? child.status : 'inactive';
}

export default function FamilyBoard({ initialChildren, canEdit }: { initialChildren: BoardChild[]; canEdit: boolean }) {
  const [children, setChildren] = useState(initialChildren);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const byColumn = new Map<ColumnId, BoardChild[]>(COLUMN_ORDER.map((c) => [c, []]));
  for (const child of children) byColumn.get(columnFor(child))?.push(child);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const newColumn = over.id as ColumnId;
    const childId = active.id as number;
    const current = children.find((c) => c.id === childId);
    if (!current) return;
    const previousColumn = columnFor(current);
    if (previousColumn === newColumn) return;

    // Client-side guard rail: block a drag into an active-status column when enrolment date or
    // programme type aren't already on file, with an inline message and no optimistic move at
    // all. The API enforces the same rule (see checkActiveStatusGuardRail) — this is just so the
    // admin sees why immediately instead of watching the card bounce back.
    if (isActiveStatus(newColumn as ChildStatus) && (!current.enrolment_date || !current.programme)) {
      setError(`${current.child_full_name}: set enrolment date and programme type first (Edit on the Child Card).`);
      return;
    }

    setError(null);
    const payload = newColumn === 'inactive' ? { isActive: false } : { status: newColumn, isActive: true };
    const nextStatus = newColumn === 'inactive' ? current.status : (newColumn as ChildStatus);
    const nextIsActive = newColumn !== 'inactive';

    setChildren((prev) => prev.map((c) => (c.id === childId ? { ...c, status: nextStatus, is_active: nextIsActive } : c)));

    try {
      const res = await fetch(`/api/admin/children/${childId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that move — reverted.');
      setChildren((prev) => prev.map((c) => (c.id === childId ? { ...c, status: current.status, is_active: current.is_active } : c)));
    }
  }

  if (!canEdit) {
    return (
      <div className="flex gap-5 overflow-x-auto pb-2">
        {COLUMN_ORDER.map((columnId) => (
          <Column key={columnId} columnId={columnId} roster={byColumn.get(columnId) || []} draggable={false} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm font-semibold text-orange-deep">{error}</p>}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-5 overflow-x-auto pb-2">
          {COLUMN_ORDER.map((columnId) => (
            <Column key={columnId} columnId={columnId} roster={byColumn.get(columnId) || []} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
