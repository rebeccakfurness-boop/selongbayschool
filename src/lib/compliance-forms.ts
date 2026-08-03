import { COMPLIANCE_ITEMS } from '@/lib/family-data';

export type ComplianceFormKey = (typeof COMPLIANCE_ITEMS)[number]['signedKey'];

export interface ComplianceFormContent {
  title: string;
  paragraphs: string[];
}

/**
 * Real policy text for each compliance form, signed by parents/guardians on enrolment (and
 * re-signed whenever the underlying policy changes materially). `{{childFullName}}` is substituted
 * with the child's name at render time (see ComplianceFormDocument.tsx); everything else is
 * static. A paragraph starting with "## " renders as a section heading rather than body text.
 *
 * `pickup_authorization_signed` still carries placeholder wording — the school hasn't finalised
 * its authorized-pickup procedure (photo ID requirements, how alternate pickups are notified,
 * etc.) the way it has for the six forms below, so it's left for a follow-up pass once that's
 * settled rather than guessed at here.
 */
export const COMPLIANCE_FORM_CONTENT: Record<ComplianceFormKey, ComplianceFormContent> = {
  liability_form_signed: {
    title: 'Liability Waiver',
    paragraphs: [
      "Selong Bay School's programme is deliberately hands-on: students surf, swim, skateboard, play padel, take part in gymnastics and scouting/survival-skills sessions, join village visits and community projects, and attend off-campus excursions and camps. This waiver covers that full range of activities, on and off campus, whether led directly by school staff or by an external activity provider engaged by the school.",
      '## Acknowledgement of Risk',
      "I understand and accept that participation in physical, outdoor, water-based, and adventure activities carries an inherent risk of injury, illness, or loss, which cannot be entirely eliminated even with reasonable care and supervision. I have had the opportunity to ask the school about the nature and supervision of these activities before agreeing to my child's, {{childFullName}}'s, participation.",
      '## Release of Liability',
      "In consideration of {{childFullName}} being permitted to take part in Selong Bay School's programme and activities, I release and hold harmless Yayasan Selong Bay Sekolah (operating as Selong Bay School), its directors, teachers, staff, and volunteers from any claim for injury, illness, loss, or damage arising from that participation, except to the extent caused by the school's own gross negligence or wilful misconduct, to the fullest extent permitted under Indonesian law.",
      '## Medical Information and Emergency Care',
      "I confirm that I have disclosed to the school office any medical conditions, allergies, medications, or other health information relevant to my child's safety and wellbeing, and I agree to keep this information current. I authorize Selong Bay School staff to administer basic first aid as needed, and, if I cannot be reached promptly using the contact and emergency details I have provided, to arrange further medical treatment or transport to a clinic or hospital for {{childFullName}} at my expense.",
      '## Photographs Taken for Safety and Records',
      'I understand that, separately from the school\'s Photography & Social Media Consent form, staff may take photographs during activities for incident records, risk assessments, or activity providers\' own safety documentation.',
      "By signing below, I confirm I have read and understood this waiver and agree to its terms on behalf of {{childFullName}}.",
    ],
  },
  photography_signed: {
    title: 'Photography & Social Media Consent',
    paragraphs: [
      '## Purpose',
      "Selong Bay School regularly photographs and records video of students during lessons, activities, excursions, and events, to celebrate school life, share learning with families, and represent the school to the wider community.",
      '## How Images May Be Used',
      "I give permission for Selong Bay School to photograph and video my child, {{childFullName}}, and to use these images and recordings on the school's website, social media accounts, newsletters, learning portfolios, printed materials, and other promotional or admissions material, both now and in future publications. Images used publicly will not be captioned with my child's surname or contact details unless I give separate, specific permission.",
      '## Respecting Other Families',
      "I understand that photographs and videos taken at school inevitably include other students, and I agree not to publish or share, on social media or elsewhere, any image showing a child other than my own without that family's consent — the same courtesy the school asks of every family in our community.",
      '## Withdrawing Consent',
      "I may withdraw this consent at any time by notifying the school office in writing. The school will stop using new images of {{childFullName}} from the date it receives my notice, though it may not always be practical to recall material already printed or published.",
      "By signing below, I confirm my consent to the terms above on behalf of {{childFullName}}.",
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
      "Selong Bay School's full Student & Parent Code of Conduct is provided separately at enrolment, available from the school office at any time, and covers expected behaviour, prohibited conduct, our response to behaviour concerns, and how to raise a grievance. This form is my acknowledgement and agreement to that Code, not a substitute for reading it.",
      '## Our Core Values',
      "Every expectation in the Code of Conduct is grounded in five values that guide life at Selong Bay School: Respect, for oneself, for others, and for the wider community and environment; Integrity, acting honestly even when no one is watching; Responsibility, taking ownership of one's actions, choices, and learning; Kindness, treating others with empathy, patience, and care; and Excellence, striving to do one's personal best in all endeavours.",
      '## What We Expect',
      "Students are expected to treat others with courtesy and respect; attend punctually, in correct uniform, and ready to learn; act with honesty; and use language and behaviour free from bullying, discrimination, or aggression, on campus and online. Parents and guardians are asked to support their child's regular attendance, uphold the school's policies, communicate respectfully with staff and other families, and raise concerns through official channels rather than confronting staff, students, or other parents directly.",
      '## Serious or Repeated Breaches',
      "Serious or repeated breaches of the Code — by a student or a parent/guardian — may lead to loss of privileges, a behaviour support plan, suspension, restricted campus access, or, as a last resort, withdrawal of enrolment.",
      "By signing below, I confirm that I have received and read the full Selong Bay School Code of Conduct and agree to uphold it as a member of the school community.",
    ],
  },
  financial_agreement_signed: {
    title: 'Financial Agreement',
    paragraphs: [
      '## Tuition and Fees',
      "I agree to pay tuition, activity, lunch, and any other applicable fees for {{childFullName}} in accordance with the fee schedule provided to me at enrolment and communicated in advance of any change, invoiced by Selong Bay School by term or as otherwise agreed in writing.",
      '## Payment Terms',
      'Each invoice is payable in full by the due date shown on it. I understand that where our family enrols more than one child at Selong Bay School, any sibling discount set out in the current fee schedule is applied automatically and does not need to be separately requested.',
      '## Late Payment',
      "If an invoice remains unpaid past its due date, I understand the school office may follow up directly with me, and that continued non-payment may result in a hold on new bookings (activities, lunches, or similar) or, in ongoing cases, a review of my child's enrolment, as set out below.",
      '## Withdrawal and Notice Period',
      "Should I wish to withdraw {{childFullName}} from Selong Bay School, I agree to give the school office at least one full calendar month's written notice. Fees for the notice period remain payable even if my child stops attending before it ends. Any registration or enrolment fee paid to secure a place is non-refundable.",
      '## Continued Enrolment',
      "I understand that my child's continued enrolment at Selong Bay School is conditional on my account remaining in good standing, and I agree to notify the school office promptly if I anticipate difficulty meeting a payment so that we can discuss it together.",
    ],
  },
  parent_protection_addendum_signed: {
    title: 'Parent Protection Addendum (Primary)',
    paragraphs: [
      '## Our Commitment to Child Safeguarding',
      "The safety and wellbeing of every child at Selong Bay School comes first. Staff are expected to maintain professional, appropriate boundaries with students at all times, to supervise students actively during the school day and on excursions, and to treat any disclosure or concern about a child's welfare seriously and confidentially.",
      '## Reporting a Concern',
      "Any parent, guardian, staff member, or student who has a concern about a child's safety or wellbeing — including concerns about the conduct of a staff member, another adult, or another student — is encouraged to raise it as soon as possible with their child's Home Room Teacher or, for a more serious or sensitive concern, directly with the Principal. Concerns are followed up promptly and handled with as much confidentiality as the safety of the child allows.",
      '## Working Together',
      "I agree to keep the school informed of any change in circumstances that may affect {{childFullName}}'s safety or wellbeing, including any court order, custody arrangement, or restriction on contact that affects who may collect my child or communicate with the school on their behalf, and to cooperate with the school's safeguarding procedures, including this Addendum and the Pickup Authorization on file.",
      '## Acknowledgement',
      "By signing below, I acknowledge that I have received and read Selong Bay School's child protection and safeguarding policy, understand how to raise a concern, and agree to support the school's safeguarding practices as they apply to {{childFullName}} while enrolled at Selong Bay School.",
    ],
  },
  data_consent_signed: {
    title: 'Personal Data Consent (UU 27/2022)',
    paragraphs: [
      "This form explains how Selong Bay School collects and uses personal data belonging to me and to my child, in line with Indonesia's Law No. 27 of 2022 on Personal Data Protection (\"PDP Law\").",
      '## What Data We Collect',
      "Depending on our relationship with your family, this may include identity and enrolment details (such as name, date of birth, and passport/KITAS information), contact and emergency contact details, health and medical information relevant to your child's safety, academic and behavioural records, financial and billing information, and photographs or video taken at school (covered separately by the Photography & Social Media Consent form).",
      '## Why We Process It',
      "Selong Bay School processes this data to enrol and educate {{childFullName}}, to keep them safe, to communicate with our family, to administer fees and invoicing, and to meet the school's own legal and reporting obligations, including to the Indonesian Ministry of Education where required.",
      '## Who We Share It With',
      "Personal data is only shared with school staff who need it to do their jobs, and with service providers acting on the school's behalf for a specific purpose — for example, Google Workspace for Education / Google Classroom, which we use to support online and in-person learning. Selong Bay School does not sell personal data, and only discloses it to a third party outside these purposes where required by Indonesian law or with my separate consent.",
      '## How Long We Keep It',
      "Personal data is retained for as long as {{childFullName}} is enrolled at Selong Bay School, and for a reasonable period afterwards to meet the school's academic, financial, and legal record-keeping obligations, after which it is securely deleted or anonymised.",
      '## Your Rights',
      "In accordance with the PDP Law, I understand that I may request access to, correction of, or deletion of personal data the school holds about myself or {{childFullName}}, and may object to or withdraw consent for a particular use of that data, by writing to the school office — subject always to the school's legitimate record-keeping and legal obligations, which may mean some data cannot be deleted immediately.",
      '## Consent',
      "I consent to Selong Bay School collecting, storing, and processing personal data relating to myself and {{childFullName}} as described above, for the purposes of enrolment, education, safety, and school administration.",
    ],
  },
};
