'use client';

import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import Button from '../Button';
import { countWords, Field, TextArea, TextInput, WordCount } from './FormField';
import FormStatusBanner from './FormStatusBanner';
import { useFormSubmit } from '@/lib/useFormSubmit';

const interestOptions = ['Preschool', 'Primary', 'Secondary School', 'Not sure yet'];
const MAX_MESSAGE_WORDS = 250;

export default function AdmissionsForm({
  defaultInterest,
  idPrefix = 'adm',
}: {
  defaultInterest?: string;
  /** Unique prefix for this form's input ids, needed when multiple AdmissionsForm instances render on the same page. */
  idPrefix?: string;
} = {}) {
  const { status, errorMessage, submit } = useFormSubmit('/api/admissions');
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [interest, setInterest] = useState(() => {
    if (defaultInterest && interestOptions.includes(defaultInterest)) return defaultInterest;
    const param = searchParams.get('interest');
    return param && interestOptions.includes(param) ? param : '';
  });
  const [message, setMessage] = useState('');
  const messageTooLong = countWords(message) > MAX_MESSAGE_WORDS;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (messageTooLong) return;
    const result = await submit({ name, email, phone, childName, childAge, interest, message });
    if (result) {
      setName('');
      setEmail('');
      setPhone('');
      setChildName('');
      setChildAge('');
      setInterest('');
      setMessage('');
    }
  }

  if (status === 'success') {
    return (
      <FormStatusBanner
        status={status}
        successMessage="Thanks for your enquiry. We've received your details and will be in touch soon with next steps."
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Parent / guardian name" htmlFor={`${idPrefix}-name`} required>
          <TextInput id={`${idPrefix}-name`} name="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor={`${idPrefix}-email`} required>
          <TextInput id={`${idPrefix}-email`} name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone / WhatsApp" htmlFor={`${idPrefix}-phone`} required>
          <TextInput id={`${idPrefix}-phone`} name="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Interested in" htmlFor={`${idPrefix}-interest`}>
          <select
            id={`${idPrefix}-interest`}
            name="interest"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className="rounded-sm border border-sand-line bg-white px-4 py-2.5 font-sans text-[15px] text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option value="">Select an option</option>
            {interestOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Child's name" htmlFor={`${idPrefix}-child-name`} required>
          <TextInput id={`${idPrefix}-child-name`} name="childName" required value={childName} onChange={(e) => setChildName(e.target.value)} />
        </Field>
        <Field label="Child's age" htmlFor={`${idPrefix}-child-age`} required>
          <TextInput id={`${idPrefix}-child-age`} name="childAge" required value={childAge} onChange={(e) => setChildAge(e.target.value)} />
        </Field>
      </div>
      <Field label="Anything else you'd like us to know? (optional)" htmlFor={`${idPrefix}-message`}>
        <TextArea id={`${idPrefix}-message`} name="message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
        <div className="flex justify-end">
          <WordCount value={message} max={MAX_MESSAGE_WORDS} />
        </div>
      </Field>

      <FormStatusBanner status={status} errorMessage={errorMessage} successMessage="" />

      <Button type="submit" variant="primary" disabled={status === 'submitting' || messageTooLong}>
        {status === 'submitting' ? 'Submitting…' : 'Submit enquiry'}
      </Button>
    </form>
  );
}
