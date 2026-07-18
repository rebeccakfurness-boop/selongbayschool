'use client';

import { useState, type FormEvent } from 'react';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import FormStatusBanner from '@/components/forms/FormStatusBanner';
import { useFormSubmit } from '@/lib/useFormSubmit';

export default function AccountSettingsForm({
  emergencyContactName,
  emergencyContactPhone,
}: {
  emergencyContactName: string;
  emergencyContactPhone: string;
}) {
  const [name, setName] = useState(emergencyContactName);
  const [phone, setPhone] = useState(emergencyContactPhone);
  const { status, errorMessage, submit } = useFormSubmit<{ ok: true }>('/api/account/settings');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await submit({ emergencyContactName: name, emergencyContactPhone: phone });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5 rounded-md border border-sand-line bg-paper p-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Emergency Contact Name" htmlFor="settings-emergency-name" required>
          <TextInput
            id="settings-emergency-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Emergency Contact Phone" htmlFor="settings-emergency-phone" required>
          <TextInput
            id="settings-emergency-phone"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
      </div>

      <FormStatusBanner status={status} errorMessage={errorMessage} successMessage="Your emergency contact details have been saved." />

      <Button type="submit" variant="accent" disabled={status === 'submitting' || !name.trim() || !phone.trim()}>
        {status === 'submitting' ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  );
}
