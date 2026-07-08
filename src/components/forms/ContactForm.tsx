'use client';

import { useState, type FormEvent } from 'react';
import Button from '../Button';
import { Field, TextArea, TextInput } from './FormField';
import FormStatusBanner from './FormStatusBanner';
import { useFormSubmit } from '@/lib/useFormSubmit';

export default function ContactForm() {
  const { status, errorMessage, submit } = useFormSubmit('/api/contact');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await submit({ name, email, phone, message });
    if (result) {
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    }
  }

  if (status === 'success') {
    return <FormStatusBanner status={status} successMessage="Thanks for reaching out. We've received your message and will be in touch soon." />;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="contact-name" required>
          <TextInput id="contact-name" name="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="contact-email" required>
          <TextInput id="contact-email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>
      <Field label="Phone (optional)" htmlFor="contact-phone">
        <TextInput id="contact-phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <Field label="Message" htmlFor="contact-message" required>
        <TextArea
          id="contact-message"
          name="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Field>

      <FormStatusBanner status={status} errorMessage={errorMessage} successMessage="" />

      <Button type="submit" variant="primary" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
