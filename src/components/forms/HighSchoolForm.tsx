'use client';

import { useState, type FormEvent } from 'react';
import Button from '../Button';
import { Field, TextArea, TextInput } from './FormField';
import FormStatusBanner from './FormStatusBanner';
import { useFormSubmit } from '@/lib/useFormSubmit';

export default function HighSchoolForm({
  compact = false,
  defaultMessage,
}: {
  compact?: boolean;
  defaultMessage?: string;
}) {
  const { status, errorMessage, submit } = useFormSubmit('/api/high-school');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(defaultMessage ?? '');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await submit({ name, email, phone, message });
    if (result) {
      setName('');
      setEmail('');
      setPhone('');
      setMessage(defaultMessage ?? '');
    }
  }

  if (status === 'success') {
    return (
      <FormStatusBanner
        status={status}
        successMessage="Thanks — your high school enquiry is with us and we'll be in touch soon."
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className={compact ? 'flex flex-col gap-4 sm:flex-row' : 'grid gap-5 sm:grid-cols-2'}>
        <Field label="Your name" htmlFor="hs-name" required>
          <TextInput id="hs-name" name="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="hs-email" required>
          <TextInput id="hs-email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>
      {!compact && (
        <Field label="Phone (optional)" htmlFor="hs-phone">
          <TextInput id="hs-phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      )}
      <Field label="Message" htmlFor="hs-message" required>
        <TextArea
          id="hs-message"
          name="message"
          required
          rows={compact ? 3 : 5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Field>

      <FormStatusBanner status={status} errorMessage={errorMessage} successMessage="" />

      <Button type="submit" variant="accent" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending…' : 'Send enquiry'}
      </Button>
    </form>
  );
}
