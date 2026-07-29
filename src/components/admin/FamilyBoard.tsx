'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { STATUS_LEGEND, STATUS_ORDER, CLASS_BAND_LABELS, type ChildStatus } from '@/lib/family-data';
import { formatDate } from '@/lib/admin-format';
import ChildAvatar from '@/components/ChildAvatar';

export interface BoardChild {
  id: number;
  status: ChildStatus;
  is_active: boolean;
  class_name: string | null;
  class_band: string | null;
  child_full_name: string;
  child_nickname: string | null;
  photo_url: string | null;
  parent1_name: string | null;
  parent2_name: string | null;
  allergies_medical_notes: string | null;
  enrolment_date: string | null;
  compliance_signed_count: number;
}

const COMPLIANCE_TOTAL = 7;

function ChildCard({ child, draggable }: { child: BoardChild; draggable: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: child.id,
    disabled: !draggable,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined;

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
      <div className="mt-2 flex items-center justify-between text-[11px] text-ink-soft">
        <span>Compliance {child.compliance_signed_count}/{COMPLIANCE_TOTAL}</span>
        {child.enrolment_date && <span>Enrolled {formatDate(child.enrolment_date)}</span>}
      </div>
    </div>
  );
}

function Column({ status, roster }: { status: ChildStatus; roster: BoardChild[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[220px] flex-col gap-3 rounded-md border p-3 transition-colors ${
        isOver ? 'border-teal bg-teal/10' : 'border-sand-line bg-sand/20'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">{STATUS_LEGEND[status].label}</span>
        <span className="text-xs font-bold text-ink-soft">{roster.length}</span>
      </div>
      {roster.map((child) => (
        <ChildCard key={child.id} child={child} draggable />
      ))}
      {roster.length === 0 && (
        <div className="rounded-md border border-dashed border-sand-line p-3 text-center text-xs text-ink-soft">
          Drop here
        </div>
      )}
    </div>
  );
}

export default function FamilyBoard({ initialChildren, canEdit }: { initialChildren: BoardChild[]; canEdit: boolean }) {
  const [children, setChildren] = useState(initialChildren);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const byStatus = new Map<ChildStatus, BoardChild[]>(STATUS_ORDER.map((s) => [s, []]));
  for (const child of children) byStatus.get(child.status)?.push(child);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as ChildStatus;
    const childId = active.id as number;
    const current = children.find((c) => c.id === childId);
    if (!current || current.status === newStatus) return;

    setError(null);
    const previous = current.status;
    setChildren((prev) => prev.map((c) => (c.id === childId ? { ...c, status: newStatus } : c)));

    try {
      const res = await fetch(`/api/admin/children/${childId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
    } catch {
      setError('Could not save that move — reverted.');
      setChildren((prev) => prev.map((c) => (c.id === childId ? { ...c, status: previous } : c)));
    }
  }

  if (!canEdit) {
    return (
      <div className="grid gap-5 lg:grid-cols-3 xl:grid-cols-6">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="flex min-w-[220px] flex-col gap-3 rounded-md border border-sand-line bg-sand/20 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">{STATUS_LEGEND[status].label}</span>
              <span className="text-xs font-bold text-ink-soft">{(byStatus.get(status) || []).length}</span>
            </div>
            {(byStatus.get(status) || []).map((child) => (
              <ChildCard key={child.id} child={child} draggable={false} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm font-semibold text-orange-deep">{error}</p>}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid gap-5 lg:grid-cols-3 xl:grid-cols-6">
          {STATUS_ORDER.map((status) => (
            <Column key={status} status={status} roster={byStatus.get(status) || []} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
