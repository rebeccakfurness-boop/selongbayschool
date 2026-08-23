'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import NewChildForm, { type NewChildFormPrefill } from '@/components/admin/NewChildForm';

/** "Enquiry → Family record" trigger on the Admissions Pipeline table — opens NewChildForm
 * pre-filled from this lead in a modal (same overlay pattern as ComplianceFormModal). Reuses the
 * exact same form as "+ New Family" rather than a second bespoke one, since the fields are
 * identical; only the submit target (the convert endpoint, which also marks the lead converted)
 * and the prefill differ. */
export default function ConvertEnquiryButton({ enquiryId, prefill }: { enquiryId: number; prefill: NewChildFormPrefill }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant="accent" onClick={() => setOpen(true)}>
        Convert to Family
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-md border border-sand-line bg-paper p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Convert lead to Family record</h3>
            <p className="mt-1 text-xs text-ink-soft">
              Pre-filled from this lead, nothing to retype, but review before creating.
            </p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="text-ink-soft hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="mt-4">
          <NewChildForm
            prefill={prefill}
            admissionsEnquiryId={enquiryId}
            onCreated={(childId) => {
              setOpen(false);
              router.push(`/admin/families/${childId}`);
            }}
            onCancel={() => setOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
