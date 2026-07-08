'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Button from './Button';
import { Field, TextInput } from './forms/FormField';
import FormStatusBanner from './forms/FormStatusBanner';
import { useFormSubmit } from '@/lib/useFormSubmit';

interface Slot {
  id: number;
  activity_slug: string;
  activity_name: string;
  slot_date: string;
  slot_time: string;
  capacity: number;
  spots_remaining: number;
}

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function BookingPanel({ activitySlug, onClose }: { activitySlug: string; onClose: () => void }) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  const { status, errorMessage, submit } = useFormSubmit<{ bookingId: number; emailWarning?: string }>('/api/bookings');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emailWarning, setEmailWarning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/bookings/slots?activity=${encodeURIComponent(activitySlug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.slots) setSlots(data.slots);
        else setLoadError('Could not load availability.');
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load availability.');
      });
    return () => {
      cancelled = true;
    };
  }, [activitySlug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedSlotId) return;
    const result = await submit({
      slotId: selectedSlotId,
      childName,
      childAge,
      parentName,
      parentEmail,
      parentPhone,
      emergencyContact,
    });
    if (result?.emailWarning) setEmailWarning(result.emailWarning);
  }

  if (status === 'success') {
    return (
      <div className="mt-4 rounded-md border border-sand-line bg-paper p-6">
        <FormStatusBanner
          status={status}
          successMessage="Your booking is confirmed! We've sent a confirmation email with the details."
        />
        {emailWarning && <p className="mt-3 text-sm text-orange-deep">{emailWarning}</p>}
        <Button variant="ghost" className="mt-4" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-md border border-sand-line bg-paper p-6">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-lg font-semibold text-ink">Choose a date & time</h4>
        <button type="button" onClick={onClose} className="text-sm font-semibold text-ink-soft hover:text-ink">
          Cancel
        </button>
      </div>

      {!slots && !loadError && <p className="mt-3 text-sm text-ink-soft">Loading availability…</p>}
      {loadError && <p className="mt-3 text-sm text-orange-deep">{loadError}</p>}
      {slots && slots.length === 0 && (
        <p className="mt-3 text-sm text-ink-soft">No upcoming dates are open for booking yet. Please check back soon or contact us directly.</p>
      )}

      {slots && slots.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {slots.map((slot) => {
            const full = slot.spots_remaining <= 0;
            const selected = selectedSlotId === slot.id;
            return (
              <button
                key={slot.id}
                type="button"
                disabled={full}
                onClick={() => setSelectedSlotId(slot.id)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  full
                    ? 'cursor-not-allowed border-black/10 bg-black/5 text-ink-soft/50 line-through'
                    : selected
                      ? 'border-teal bg-teal text-white'
                      : 'border-sand-line bg-white text-ink hover:border-teal'
                }`}
              >
                {formatDate(slot.slot_date)} &middot; {slot.slot_time}
                {!full && <span className="ml-1 font-normal opacity-70">({slot.spots_remaining} left)</span>}
                {full && <span className="ml-1 font-normal">(Full)</span>}
              </button>
            );
          })}
        </div>
      )}

      {selectedSlotId && (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 border-t border-sand-line pt-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Child's name" htmlFor="bk-child-name" required>
              <TextInput id="bk-child-name" required value={childName} onChange={(e) => setChildName(e.target.value)} />
            </Field>
            <Field label="Child's age" htmlFor="bk-child-age" required>
              <TextInput id="bk-child-age" required value={childAge} onChange={(e) => setChildAge(e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Parent name" htmlFor="bk-parent-name" required>
              <TextInput id="bk-parent-name" required value={parentName} onChange={(e) => setParentName(e.target.value)} />
            </Field>
            <Field label="Parent email" htmlFor="bk-parent-email" required>
              <TextInput id="bk-parent-email" type="email" required value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Parent phone" htmlFor="bk-parent-phone" required>
              <TextInput id="bk-parent-phone" required value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
            </Field>
            <Field label="Emergency contact" htmlFor="bk-emergency" required>
              <TextInput id="bk-emergency" required value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
            </Field>
          </div>

          <FormStatusBanner status={status} errorMessage={errorMessage} successMessage="" />

          <Button type="submit" variant="accent" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Booking…' : 'Confirm booking'}
          </Button>
        </form>
      )}
    </div>
  );
}
