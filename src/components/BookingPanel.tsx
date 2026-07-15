'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Button from './Button';
import { Field, TextInput } from './forms/FormField';
import FormStatusBanner from './forms/FormStatusBanner';
import { useFormSubmit } from '@/lib/useFormSubmit';
import { bankTransferDetails, formatIDR } from '@/lib/site-content';

interface Slot {
  id: number;
  activity_slug: string;
  activity_name: string;
  slot_date: string;
  slot_time: string;
  capacity: number;
  spots_remaining: number;
  price_idr: number | null;
  price_note: string | null;
}

interface Account {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
}

interface ActivePass {
  id: number;
  sessionsRemaining: number;
  expiresAt: string;
}

type PaymentMethod = 'pay_online' | 'pay_at_session' | 'pack_session';

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

  const [account, setAccount] = useState<Account | null>(null);
  const [accountChecked, setAccountChecked] = useState(false);
  const [continuingAsGuest, setContinuingAsGuest] = useState(false);

  const { status, errorMessage, submit } = useFormSubmit<{ bookingId: number; emailWarning?: string }>('/api/bookings');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);
  const [activePass, setActivePass] = useState<ActivePass | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    fetch('/api/account/me')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.customer) {
          setAccount(data.customer);
          setParentName((current) => current || data.customer.name || '');
          setParentEmail((current) => current || data.customer.email || '');
          setParentPhone((current) => current || data.customer.phone || '');
        }
        setAccountChecked(true);
      })
      .catch(() => setAccountChecked(true));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!account || !childName.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActivePass(null);
      if (paymentMethod === 'pack_session') setPaymentMethod(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      fetch(`/api/passes/active?childName=${encodeURIComponent(childName.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          setActivePass(data.pass ?? null);
          if (!data.pass && paymentMethod === 'pack_session') setPaymentMethod(null);
        })
        .catch(() => {
          if (!cancelled) setActivePass(null);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, childName]);

  const selectedSlot = slots?.find((slot) => slot.id === selectedSlotId) ?? null;
  const amountLabel = selectedSlot?.price_idr ? formatIDR(selectedSlot.price_idr) : selectedSlot?.price_note;
  const showDetailsForm = Boolean(account) || continuingAsGuest;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedSlotId || !paymentMethod) return;
    if (paymentMethod === 'pack_session' && !activePass) return;
    const result = await submit({
      slotId: selectedSlotId,
      childName,
      childAge,
      parentName,
      parentEmail,
      parentPhone,
      emergencyContact,
      paymentMethod,
      passId: paymentMethod === 'pack_session' ? activePass?.id : undefined,
    });
    if (result?.emailWarning) setEmailWarning(result.emailWarning);
  }

  if (status === 'success') {
    return (
      <div className="mt-4 rounded-md border border-sand-line bg-paper p-6">
        <FormStatusBanner
          status={status}
          successMessage={
            paymentMethod === 'pay_online'
              ? "Your booking is saved! We've emailed you the bank transfer details — please complete payment before your session."
              : paymentMethod === 'pack_session'
                ? "Your booking is confirmed using a session from your pack! We've sent a confirmation email with the details."
                : "Your booking is confirmed! We've sent a confirmation email with the details. You can pay in person at the session."
          }
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

      {selectedSlotId && accountChecked && !showDetailsForm && (
        <div className="mt-6 border-t border-sand-line pt-5">
          <p className="font-display text-base font-semibold text-ink">How would you like to book?</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button type="button" variant="primary" onClick={() => setContinuingAsGuest(true)}>
              Continue as guest
            </Button>
            <Button href={`/account/login?next=${encodeURIComponent('/activities')}`} variant="ghost">
              Log in
            </Button>
            <Button href={`/account/signup?next=${encodeURIComponent('/activities')}`} variant="ghost">
              Sign up
            </Button>
          </div>
          <p className="mt-3 text-xs text-ink-soft">
            Signing up saves your details for next time and lets you see your booking history. Guest bookings don&apos;t create an account.
          </p>
        </div>
      )}

      {selectedSlotId && showDetailsForm && (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 border-t border-sand-line pt-5" noValidate>
          {account && (
            <p className="text-sm text-ink-soft">
              Booking as <span className="font-semibold text-ink">{account.email}</span>.
            </p>
          )}
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

          <div className="border-t border-sand-line pt-5">
            <p className="font-display text-base font-semibold text-ink">
              How would you like to pay?{!activePass && amountLabel ? ` (${amountLabel})` : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {activePass ? (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pack_session')}
                  className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
                    paymentMethod === 'pack_session' ? 'border-teal bg-teal text-white' : 'border-sand-line bg-white text-ink hover:border-teal'
                  }`}
                >
                  Use a session from your pack ({activePass.sessionsRemaining} left)
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pay_online')}
                    className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
                      paymentMethod === 'pay_online' ? 'border-teal bg-teal text-white' : 'border-sand-line bg-white text-ink hover:border-teal'
                    }`}
                  >
                    Pay Online
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pay_at_session')}
                    className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
                      paymentMethod === 'pay_at_session' ? 'border-teal bg-teal text-white' : 'border-sand-line bg-white text-ink hover:border-teal'
                    }`}
                  >
                    Pay at the Session
                  </button>
                </>
              )}
            </div>

            {paymentMethod === 'pay_online' && (
              <div className="mt-4 rounded-md border border-teal/30 bg-aqua/30 p-4 text-sm text-ink">
                <p className="font-semibold text-teal-deep">Bank transfer details</p>
                <p className="mt-2 leading-relaxed">
                  Bank: {bankTransferDetails.bank}
                  <br />
                  Account Number: {bankTransferDetails.accountNumber}
                  <br />
                  Name: {bankTransferDetails.accountName}
                </p>
                <a
                  href={bankTransferDetails.wiseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block font-semibold text-teal-deep underline"
                >
                  Or pay via Wise →
                </a>
                <p className="mt-3 text-xs text-ink-soft">We&apos;ll also email you these details for your records.</p>
              </div>
            )}
          </div>

          <FormStatusBanner status={status} errorMessage={errorMessage} successMessage="" />

          <Button type="submit" variant="accent" disabled={status === 'submitting' || !paymentMethod}>
            {status === 'submitting' ? 'Booking…' : 'Confirm booking'}
          </Button>
        </form>
      )}
    </div>
  );
}
