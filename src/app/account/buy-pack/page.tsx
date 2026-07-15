'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import FormStatusBanner from '@/components/forms/FormStatusBanner';
import { useFormSubmit } from '@/lib/useFormSubmit';
import { activityPass, bankTransferDetails, formatIDR } from '@/lib/site-content';

type PaymentMethod = 'pay_online' | 'pay_at_session';

export default function BuyPackPage() {
  const [childName, setChildName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const { status, errorMessage, submit } = useFormSubmit<{ ok: true; passId: number }>('/api/passes');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!paymentMethod) return;
    await submit({ childName, paymentMethod });
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-ink">Buy an Activity Pack</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {activityPass.totalSessions} sessions for {formatIDR(activityPass.priceIDR)}, valid for {activityPass.validityLabel} from purchase.
        Use it across any activity for one child.
      </p>

      {status === 'success' ? (
        <div className="mt-8">
          <FormStatusBanner
            status={status}
            successMessage={
              paymentMethod === 'pay_online'
                ? "Your pack is saved! We've emailed you the bank transfer details. Please complete payment to activate it."
                : "Your pack is confirmed! We've sent a confirmation email with the details. You can pay in person at the school."
            }
          />
          <Link href="/account/bookings" className="mt-4 inline-block font-semibold text-teal-deep underline">
            Go to My Bookings
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5 rounded-md border border-sand-line bg-paper p-6" noValidate>
          <Field label="Child's name" htmlFor="pack-child-name" required>
            <TextInput id="pack-child-name" required autoFocus value={childName} onChange={(e) => setChildName(e.target.value)} />
          </Field>

          <div className="rounded-md border border-sand-line bg-cream/60 p-4">
            <p className="text-sm font-semibold text-ink">
              {activityPass.totalSessions} sessions &middot; {formatIDR(activityPass.priceIDR)} &middot; valid {activityPass.validityLabel}
            </p>
          </div>

          <div>
            <p className="font-display text-base font-semibold text-ink">How would you like to pay?</p>
            <div className="mt-3 flex flex-wrap gap-3">
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

          <Button type="submit" variant="accent" disabled={status === 'submitting' || !childName.trim() || !paymentMethod}>
            {status === 'submitting' ? 'Submitting…' : 'Buy Pack'}
          </Button>
        </form>
      )}
    </div>
  );
}
