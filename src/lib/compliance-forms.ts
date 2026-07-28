import { COMPLIANCE_ITEMS } from '@/lib/family-data';

export type ComplianceFormKey = (typeof COMPLIANCE_ITEMS)[number]['signedKey'];

export interface ComplianceFormContent {
  title: string;
  paragraphs: string[];
}

/**
 * PLACEHOLDER LEGAL TEXT. Each form below needs the school's actual wording swapped in before
 * these are used for anything binding — replace the `paragraphs` array for the relevant key.
 * `{{childFullName}}` is substituted with the child's name at render time (see
 * ComplianceFormDocument.tsx); everything else is static.
 */
export const COMPLIANCE_FORM_CONTENT: Record<ComplianceFormKey, ComplianceFormContent> = {
  liability_form_signed: {
    title: 'Liability Waiver',
    paragraphs: [
      '[PLACEHOLDER TEXT — replace with the school\'s actual liability waiver wording.]',
      'I acknowledge that participation in Selong Bay School activities carries inherent risks, and I release Selong Bay School, its staff, and representatives from liability for injury, loss, or damage arising from my child\'s, {{childFullName}}\'s, participation in school activities, to the fullest extent permitted by law.',
      'I confirm that I have disclosed any medical conditions or allergies relevant to my child\'s safety on file with the school.',
    ],
  },
  photography_signed: {
    title: 'Photography & Social Media Consent',
    paragraphs: [
      '[PLACEHOLDER TEXT — replace with the school\'s actual photography/social media consent wording.]',
      'I give permission for Selong Bay School to photograph and video my child, {{childFullName}}, during school activities, and to use these images for the school\'s website, social media, newsletters, and promotional materials.',
      'I understand I may withdraw this consent at any time by notifying the school office in writing.',
    ],
  },
  pickup_authorization_signed: {
    title: 'Pickup Authorization',
    paragraphs: [
      '[PLACEHOLDER TEXT — replace with the school\'s actual pickup authorization wording.]',
      'I authorize Selong Bay School to release my child, {{childFullName}}, only to myself, the parents/guardians on file, or the individuals I have separately named as authorized pickup persons.',
      'I understand the school will request photo identification from anyone unfamiliar collecting my child.',
    ],
  },
  behavioral_form_signed: {
    title: 'Behavioral / Code of Conduct Agreement',
    paragraphs: [
      '[PLACEHOLDER TEXT — replace with the school\'s actual code of conduct wording.]',
      'I have read and discussed the school\'s code of conduct with my child, {{childFullName}}, and agree to support the school\'s behavioral expectations and disciplinary policies.',
      'I understand that repeated or serious breaches of the code of conduct may result in disciplinary action up to and including suspension or withdrawal of enrolment.',
    ],
  },
  financial_agreement_signed: {
    title: 'Financial Agreement',
    paragraphs: [
      '[PLACEHOLDER TEXT — replace with the school\'s actual financial agreement wording.]',
      'I agree to pay all tuition, fees, and other charges for {{childFullName}} in accordance with the fee schedule and payment terms provided by Selong Bay School, including any applicable late payment terms.',
      'I understand that continued enrolment is conditional on my account remaining in good standing.',
    ],
  },
  parent_protection_addendum_signed: {
    title: 'Parent Protection Addendum (Primary)',
    paragraphs: [
      '[PLACEHOLDER TEXT — replace with the school\'s actual parent protection addendum wording.]',
      'I acknowledge receipt of, and agree to, the school\'s child protection and safeguarding policy as it applies to my child, {{childFullName}}, while enrolled at Selong Bay School.',
    ],
  },
  data_consent_signed: {
    title: 'Personal Data Consent (UU 27/2022)',
    paragraphs: [
      '[PLACEHOLDER TEXT — replace with the school\'s actual data consent wording, aligned with Indonesia\'s Personal Data Protection Law (UU No. 27/2022).]',
      'I consent to Selong Bay School collecting, storing, and processing personal data relating to myself and my child, {{childFullName}}, for the purposes of enrolment, education, safety, and school administration.',
      'I understand I may request access to, correction of, or deletion of this data in accordance with applicable law, subject to the school\'s legitimate record-keeping obligations.',
    ],
  },
};
