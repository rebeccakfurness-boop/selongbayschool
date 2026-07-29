'use client';

import { useState, type FormEvent } from 'react';
import Button from '../Button';
import { Field, TextArea, TextInput } from './FormField';
import FormStatusBanner from './FormStatusBanner';
import { useFormSubmit } from '@/lib/useFormSubmit';

const selectClasses =
  'rounded-sm border border-sand-line bg-white px-4 py-2.5 font-sans text-[15px] text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30';

const ENROLMENT_LENGTH_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '1_week', label: '1 week' },
  { value: '1_month', label: '1 month' },
  { value: '1_term', label: '1 term' },
  { value: 'full_year', label: 'Full school year' },
  { value: 'ongoing', label: 'Ongoing / permanent enrolment' },
  { value: 'other', label: 'Other' },
];

const KITAS_STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'has_kitas', label: 'Has KITAS' },
  { value: 'in_progress', label: 'KITAS application in progress' },
  { value: 'not_applicable', label: 'Not applicable (Indonesian citizen)' },
  { value: 'other', label: 'Other' },
];

function RadioOption({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[15px] text-ink">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="h-4 w-4 accent-teal"
      />
      {label}
    </label>
  );
}

export default function EnrolmentForm() {
  const { status, errorMessage, submit } = useFormSubmit('/api/enrolment');

  const [studentName, setStudentName] = useState('');
  const [studentDob, setStudentDob] = useState('');
  const [previousSchool, setPreviousSchool] = useState('');
  const [previousGrade, setPreviousGrade] = useState('');
  const [siblingsAttending, setSiblingsAttending] = useState('');

  const [startDate, setStartDate] = useState('');
  const [enrolmentLength, setEnrolmentLength] = useState('');
  const [enrolmentLengthOther, setEnrolmentLengthOther] = useState('');

  const [kitasStatus, setKitasStatus] = useState('');
  const [kitasNotes, setKitasNotes] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportNationality, setPassportNationality] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');

  const [photographyConsent, setPhotographyConsent] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [allergies, setAllergies] = useState('');

  const [lunchOption, setLunchOption] = useState('');
  const [lunchOtherNotes, setLunchOtherNotes] = useState('');

  const [shuttleService, setShuttleService] = useState('');

  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [authorizedPickup, setAuthorizedPickup] = useState('');

  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentWhatsapp, setParentWhatsapp] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await submit({
      studentName,
      studentDob,
      previousSchool,
      previousGrade,
      siblingsAttending,
      startDate,
      enrolmentLength,
      enrolmentLengthOther,
      kitasStatus,
      kitasNotes,
      passportNumber,
      passportNationality,
      passportExpiry,
      photographyConsent,
      medicalConditions,
      allergies,
      lunchOption,
      lunchOtherNotes,
      shuttleService,
      emergencyContactName,
      emergencyContactPhone,
      authorizedPickup,
      parentName,
      parentEmail,
      parentWhatsapp,
    });
    if (result) {
      setStudentName('');
      setStudentDob('');
      setPreviousSchool('');
      setPreviousGrade('');
      setSiblingsAttending('');
      setStartDate('');
      setEnrolmentLength('');
      setEnrolmentLengthOther('');
      setKitasStatus('');
      setKitasNotes('');
      setPassportNumber('');
      setPassportNationality('');
      setPassportExpiry('');
      setPhotographyConsent('');
      setMedicalConditions('');
      setAllergies('');
      setLunchOption('');
      setLunchOtherNotes('');
      setShuttleService('');
      setEmergencyContactName('');
      setEmergencyContactPhone('');
      setAuthorizedPickup('');
      setParentName('');
      setParentEmail('');
      setParentWhatsapp('');
    }
  }

  if (status === 'success') {
    return (
      <FormStatusBanner
        status={status}
        successMessage="Thanks for submitting your enrolment details. We've received everything and will be in touch soon with next steps."
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10" noValidate>
      <p className="rounded-md border border-teal/20 bg-aqua/40 px-5 py-4 text-[15px] text-ink-soft">
        Submitting this form is not confirmation of a place at Selong Bay School. Enrolment follows an online or
        in-person meeting, after which families receive a formal letter of acceptance. As we are a growing school, we
        may not always be able to accommodate every family&apos;s exact preferred start date or age group.
      </p>

      <div className="flex flex-col gap-5">
        <h3 className="font-display text-lg font-semibold text-ink">Student details</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Student's full name" htmlFor="enr-student-name" required>
            <TextInput id="enr-student-name" required value={studentName} onChange={(e) => setStudentName(e.target.value)} />
          </Field>
          <Field label="Student's date of birth" htmlFor="enr-student-dob" required>
            <TextInput id="enr-student-dob" type="date" required value={studentDob} onChange={(e) => setStudentDob(e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Previous school (optional)" htmlFor="enr-previous-school">
            <TextInput id="enr-previous-school" value={previousSchool} onChange={(e) => setPreviousSchool(e.target.value)} />
          </Field>
          <Field label="Previous grade / year level (optional)" htmlFor="enr-previous-grade">
            <TextInput id="enr-previous-grade" value={previousGrade} onChange={(e) => setPreviousGrade(e.target.value)} />
          </Field>
        </div>
        <Field label="Any siblings currently attending Selong Bay? (optional)" htmlFor="enr-siblings">
          <TextInput
            id="enr-siblings"
            placeholder="Name(s) and grade, if applicable"
            value={siblingsAttending}
            onChange={(e) => setSiblingsAttending(e.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-5 border-t border-sand-line pt-8">
        <h3 className="font-display text-lg font-semibold text-ink">Enrolment details</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Preferred start date" htmlFor="enr-start-date" required>
            <TextInput id="enr-start-date" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Length of enrolment" htmlFor="enr-length" required>
            <select
              id="enr-length"
              required
              value={enrolmentLength}
              onChange={(e) => setEnrolmentLength(e.target.value)}
              className={selectClasses}
            >
              <option value="">Select an option</option>
              {ENROLMENT_LENGTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {enrolmentLength === 'other' && (
          <Field label="Please specify" htmlFor="enr-length-other">
            <TextInput id="enr-length-other" value={enrolmentLengthOther} onChange={(e) => setEnrolmentLengthOther(e.target.value)} />
          </Field>
        )}
      </div>

      <div className="flex flex-col gap-5 border-t border-sand-line pt-8">
        <h3 className="font-display text-lg font-semibold text-ink">KITAS &amp; passport</h3>
        <Field label="Student's KITAS status" htmlFor="enr-kitas-status" required>
          <select
            id="enr-kitas-status"
            required
            value={kitasStatus}
            onChange={(e) => setKitasStatus(e.target.value)}
            className={selectClasses}
          >
            <option value="">Select an option</option>
            {KITAS_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="KITAS notes (optional)" htmlFor="enr-kitas-notes">
          <TextInput id="enr-kitas-notes" value={kitasNotes} onChange={(e) => setKitasNotes(e.target.value)} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Passport number (optional)" htmlFor="enr-passport-number">
            <TextInput id="enr-passport-number" value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} />
          </Field>
          <Field label="Nationality (optional)" htmlFor="enr-passport-nationality">
            <TextInput id="enr-passport-nationality" value={passportNationality} onChange={(e) => setPassportNationality(e.target.value)} />
          </Field>
          <Field label="Passport expiry (optional)" htmlFor="enr-passport-expiry">
            <TextInput id="enr-passport-expiry" type="date" value={passportExpiry} onChange={(e) => setPassportExpiry(e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="flex flex-col gap-5 border-t border-sand-line pt-8">
        <h3 className="font-display text-lg font-semibold text-ink">Consent &amp; health</h3>
        <Field label="Do you consent to your child being photographed for school marketing and social media?" htmlFor="enr-photo-consent-yes" required>
          <div className="flex gap-6">
            <RadioOption name="photographyConsent" value="yes" label="Yes" checked={photographyConsent === 'yes'} onChange={setPhotographyConsent} />
            <RadioOption name="photographyConsent" value="no" label="No" checked={photographyConsent === 'no'} onChange={setPhotographyConsent} />
          </div>
        </Field>
        <Field label="Medical conditions (optional)" htmlFor="enr-medical">
          <TextArea id="enr-medical" rows={3} value={medicalConditions} onChange={(e) => setMedicalConditions(e.target.value)} />
        </Field>
        <Field label="Allergies (optional)" htmlFor="enr-allergies">
          <TextArea id="enr-allergies" rows={3} value={allergies} onChange={(e) => setAllergies(e.target.value)} />
        </Field>
      </div>

      <div className="flex flex-col gap-5 border-t border-sand-line pt-8">
        <h3 className="font-display text-lg font-semibold text-ink">Lunch</h3>
        <Field label="Lunch option" htmlFor="enr-lunch-bring-own" required>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <RadioOption name="lunchOption" value="bring_own" label="Bring own lunch" checked={lunchOption === 'bring_own'} onChange={setLunchOption} />
            <RadioOption name="lunchOption" value="godspeed" label="Godspeed direct order" checked={lunchOption === 'godspeed'} onChange={setLunchOption} />
            <RadioOption name="lunchOption" value="other" label="Other" checked={lunchOption === 'other'} onChange={setLunchOption} />
          </div>
        </Field>
        {lunchOption === 'other' && (
          <Field label="Please specify" htmlFor="enr-lunch-other">
            <TextInput id="enr-lunch-other" value={lunchOtherNotes} onChange={(e) => setLunchOtherNotes(e.target.value)} />
          </Field>
        )}
      </div>

      <div className="flex flex-col gap-5 border-t border-sand-line pt-8">
        <h3 className="font-display text-lg font-semibold text-ink">Shuttle service</h3>
        <Field label="Do you require the shuttle service? Leaves from The Well in Kuta, to the school and back each school day." htmlFor="enr-shuttle-yes" required>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <RadioOption name="shuttleService" value="yes" label="Yes" checked={shuttleService === 'yes'} onChange={setShuttleService} />
            <RadioOption name="shuttleService" value="no" label="No" checked={shuttleService === 'no'} onChange={setShuttleService} />
          </div>
        </Field>
      </div>

      <div className="flex flex-col gap-5 border-t border-sand-line pt-8">
        <h3 className="font-display text-lg font-semibold text-ink">Emergency contact &amp; authorised pickup</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Emergency contact name" htmlFor="enr-emergency-name" required>
            <TextInput id="enr-emergency-name" required value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
          </Field>
          <Field label="Emergency contact phone" htmlFor="enr-emergency-phone" required>
            <TextInput id="enr-emergency-phone" required value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} />
          </Field>
        </div>
        <Field label="Anyone else authorised to pick up or drop off your child? (optional)" htmlFor="enr-authorized-pickup">
          <TextArea
            id="enr-authorized-pickup"
            rows={3}
            placeholder="Name(s), relationship, and phone number, other than parents and the emergency contact above"
            value={authorizedPickup}
            onChange={(e) => setAuthorizedPickup(e.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-5 border-t border-sand-line pt-8">
        <h3 className="font-display text-lg font-semibold text-ink">Parent / guardian details</h3>
        <p className="text-sm text-ink-soft">Used for invoicing and to set up your login to the parent portal.</p>
        <Field label="Parent / guardian name" htmlFor="enr-parent-name" required>
          <TextInput id="enr-parent-name" required value={parentName} onChange={(e) => setParentName(e.target.value)} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Parent / guardian email" htmlFor="enr-parent-email" required>
            <TextInput id="enr-parent-email" type="email" required value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} />
          </Field>
          <Field label="Parent / guardian WhatsApp" htmlFor="enr-parent-whatsapp" required>
            <TextInput id="enr-parent-whatsapp" required value={parentWhatsapp} onChange={(e) => setParentWhatsapp(e.target.value)} />
          </Field>
        </div>
      </div>

      <FormStatusBanner status={status} errorMessage={errorMessage} successMessage="" />

      <Button type="submit" variant="primary" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Submitting…' : 'Submit enrolment'}
      </Button>
    </form>
  );
}
