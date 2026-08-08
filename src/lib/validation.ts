import { z } from 'zod';

/** Prefixes a Zod validation error with the field it came from (e.g. "dob: must be a valid date
 * (YYYY-MM-DD)") instead of the bare message alone — on a form with dozens of fields bundled into
 * one save, "Invalid" by itself doesn't say which of them broke the request. */
export function firstIssueMessage(error: z.ZodError, fallback: string): string {
  const issue = error.issues[0];
  if (!issue) return fallback;
  const path = issue.path.join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
}

const name = z.string().trim().min(1, 'Name is required').max(200);
const email = z.string().trim().email('Enter a valid email address').max(320);
const phone = z.string().trim().min(1, 'Phone number is required').max(50);
const optionalText = z.string().trim().max(4000).optional().or(z.literal(''));

const MAX_MESSAGE_WORDS = 250;
function wordCount(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}
const maxWords = { message: `Please keep your message to ${MAX_MESSAGE_WORDS} words or fewer.` };

export const contactSchema = z.object({
  name,
  email,
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  childName: z.string().trim().max(200).optional().or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(1, 'Please add a short message')
    .max(4000)
    .refine((value) => wordCount(value) <= MAX_MESSAGE_WORDS, maxWords),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const admissionsSchema = z.object({
  name,
  email,
  phone,
  childName: z.string().trim().min(1, "Child's name is required").max(200),
  childAge: z.string().trim().min(1, "Child's age is required").max(50),
  message: optionalText.refine((value) => !value || wordCount(value) <= MAX_MESSAGE_WORDS, maxWords),
  interest: z.string().trim().max(200).optional().or(z.literal('')),
});
export type AdmissionsInput = z.infer<typeof admissionsSchema>;

export const highSchoolSchema = z.object({
  name,
  email,
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  childName: z.string().trim().max(200).optional().or(z.literal('')),
  message: optionalText.refine((value) => !value || wordCount(value) <= MAX_MESSAGE_WORDS, maxWords),
});
export type HighSchoolInput = z.infer<typeof highSchoolSchema>;

export const bookingSchema = z
  .object({
    slotId: z.coerce.number().int().positive(),
    childName: z.string().trim().min(1, "Child's name is required").max(200),
    childAge: z.string().trim().min(1, "Child's age is required").max(50),
    parentName: z.string().trim().min(1, 'Parent name is required').max(200),
    parentEmail: email,
    parentPhone: phone,
    emergencyContactName: z.string().trim().min(1, 'Emergency contact name is required').max(200),
    emergencyContactPhone: z.string().trim().min(1, 'Emergency contact phone is required').max(50),
    paymentMethod: z.enum(['pay_online', 'pay_at_session', 'pack_session'], { message: 'Please choose a payment option' }),
    passId: z.coerce.number().int().positive().optional(),
  })
  .refine((data) => data.paymentMethod !== 'pack_session' || data.passId !== undefined, {
    message: 'Missing pack to use for this booking.',
    path: ['passId'],
  });

export const updateBookingStatusSchema = z.object({
  status: z.literal('paid'),
});
export type BookingInput = z.infer<typeof bookingSchema>;

export const availabilitySlotSchema = z.object({
  activitySlug: z.string().trim().min(1).max(100),
  activityName: z.string().trim().min(1).max(200),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  time: z.string().trim().min(1).max(50),
  capacity: z.coerce.number().int().positive().max(500),
});

const priceIDR = z.coerce.number().int('Price must be a whole number of IDR (no decimals)').nonnegative().max(1_000_000_000);

export const createActivitySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  day: z.string().trim().max(100).optional().or(z.literal('')),
  duration: z.string().trim().max(100).optional().or(z.literal('')),
  priceIDR: priceIDR.optional(),
  priceNote: z.string().trim().max(200).optional().or(z.literal('')),
  defaultTime: z.string().trim().max(50).optional().or(z.literal('')),
  defaultCapacity: z.coerce.number().int().positive().max(500).default(10),
  description: z.string().trim().min(1, 'Description is required').max(2000),
  ageGroup: z.string().trim().max(100).optional().or(z.literal('')),
  photoUrl: z.string().trim().url().max(2000).optional().or(z.literal('')),
});
export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const updateActivitySchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  day: z.string().trim().max(100).optional(),
  duration: z.string().trim().max(100).optional(),
  priceIDR: priceIDR.nullable().optional(),
  defaultTime: z.string().trim().max(50).optional(),
  defaultCapacity: z.coerce.number().int().positive().max(500).optional(),
  isActive: z.boolean().optional(),
  photoUrl: z.string().trim().url().max(2000).optional(),
  description: z.string().trim().min(1, 'Description is required').max(2000).optional(),
});
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const adminForgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});
export type AdminForgotPasswordInput = z.infer<typeof adminForgotPasswordSchema>;

export const adminResetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Missing reset token'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;

/** Accepts a plain "YYYY-MM-DD" (the normal case — every date `<input>` in the app produces this),
 * but also self-heals a couple of shapes that have broken a whole Child Card save in the past: a
 * full ISO timestamp like "2015-06-01T00:00:00.000Z" (the DATE-column-as-Date-object bug fixed in
 * db.ts's type parser — kept here too as defense in depth, since any other write path that isn't
 * covered by that parser would otherwise still hard-fail the entire form), and blank/whitespace
 * (treated as "leave unset", matching every other optional field). Anything else fails with a
 * message naming the field, instead of Zod's bare "Invalid", so a bad value is diagnosable instead
 * of just blocking the save with no clue which field caused it. */
const optionalDate = z
  .string()
  .nullable()
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined;
    if (val === null) return null;
    const trimmed = val.trim();
    if (trimmed === '') return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})T/);
    return isoMatch ? isoMatch[1] : trimmed;
  })
  .refine((val) => val === null || val === undefined || /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: 'must be a valid date (YYYY-MM-DD)',
  });
const optionalStr = z.string().trim().max(2000).nullable().optional();

/** The ONLY schema that can move a card between board columns — used exclusively by
 * PATCH /api/admin/children/[id]/status (the drag-transition endpoint). status/isActive are
 * deliberately absent from updateChildSchema below (the general edit-form save), so dragging is
 * the only way either field changes on an existing child; see src/lib/child-lifecycle.ts for the
 * guard-rail check this schema's caller applies before an active-status transition is allowed. */
export const updateChildStatusSchema = z
  .object({
    status: z.enum(['enquiry', 'booking_waitlist', 'full_time', 'temporary', 'worldschooler', 'hybrid']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => d.status !== undefined || d.isActive !== undefined, { message: 'Nothing to update.' });
export type UpdateChildStatusInput = z.infer<typeof updateChildStatusSchema>;

export const updateChildSchema = z.object({
  programme: optionalStr,
  classBand: z.enum(['early_years', 'kindergarten', 'primary', 'secondary']).nullable().optional(),
  className: optionalStr,
  childFullName: z.string().trim().min(1).max(200).optional(),
  childNickname: optionalStr,
  dob: optionalDate,
  gender: optionalStr,
  nationality: optionalStr,
  enrolmentDate: optionalDate,
  exitDate: optionalDate,
  parent1Name: optionalStr,
  parent1Relationship: optionalStr,
  parent1Nationality: optionalStr,
  parent2Name: optionalStr,
  parent2Relationship: optionalStr,
  parent2Nationality: optionalStr,
  siblingsAtSchool: optionalStr,
  siblingDiscountTier: optionalStr,
  tuitionPlan: optionalStr,
  paymentStatus: optionalStr,
  emergencyContactName: optionalStr,
  emergencyContactPhone: optionalStr,
  allergiesMedicalNotes: optionalStr,
  dietaryRequirements: optionalStr,
  religion: optionalStr,
  homeLanguage: optionalStr,
  primaryContactEmail: optionalStr,
  primaryContactPhone: optionalStr,
  nisnRequestSigned: z.boolean().optional(),
  nisnRequestDate: optionalDate,
  nisnNumber: optionalStr,
  liabilityFormSigned: z.boolean().optional(),
  liabilityFormDate: optionalDate,
  photographySigned: z.boolean().optional(),
  photographyConsent: optionalStr,
  photographyFormDate: optionalDate,
  pickupAuthorizationSigned: z.boolean().optional(),
  authorizedPickupPersons: optionalStr,
  pickupFormDate: optionalDate,
  behavioralFormSigned: z.boolean().optional(),
  behavioralFormDate: optionalDate,
  financialAgreementSigned: z.boolean().optional(),
  financialAgreementDate: optionalDate,
  parentProtectionAddendumSigned: z.boolean().optional(),
  dataConsentSigned: z.boolean().optional(),
  passportCopyUrl: optionalStr,
  visaStatus: optionalStr,
  kitasCopyUrl: optionalStr,
  birthCertificateUrl: optionalStr,
  previousSchool: optionalStr,
  lunchOption: optionalStr,
  photoUrl: optionalStr,
  classroomStudentEmail: optionalStr,
  enrollmentType: z.enum(['regular', 'activities_only']).optional(),
});
export type UpdateChildInput = z.infer<typeof updateChildSchema>;

/** status/isActive are here (creation) and in updateChildStatusSchema (drag) but nowhere in
 * updateChildSchema (the general edit-form save) — a brand-new record needs a starting status,
 * same as it needs a starting name, but once created the only way either field changes again is
 * dragging the card. */
export const createChildSchema = updateChildSchema.extend({
  childFullName: z.string().trim().min(1, "Child's full name is required").max(200),
  status: z.enum(['enquiry', 'booking_waitlist', 'full_time', 'temporary', 'worldschooler', 'hybrid']).optional(),
  isActive: z.boolean().optional(),
});
export type CreateChildInput = z.infer<typeof createChildSchema>;

/** What a parent/guardian may edit on their own linked child, via /api/account/children/[id] —
 * deliberately a much smaller field set than updateChildSchema. Enrollment status, class,
 * programme, and every financial field are absent on purpose (never parent-editable, regardless
 * of what's shown read-only on the card); zod drops any other key a client sends rather than
 * erroring, so this list is the actual security boundary, not just a UI nicety. */
export const updateOwnChildSchema = z.object({
  primaryContactEmail: optionalStr,
  primaryContactPhone: optionalStr,
  emergencyContactName: optionalStr,
  emergencyContactPhone: optionalStr,
  allergiesMedicalNotes: optionalStr,
  dietaryRequirements: optionalStr,
  lunchOption: optionalStr,
  homeLanguage: optionalStr,
  previousSchool: optionalStr,
  photoUrl: optionalStr,
  passportCopyUrl: optionalStr,
  kitasCopyUrl: optionalStr,
  birthCertificateUrl: optionalStr,
});
export type UpdateOwnChildInput = z.infer<typeof updateOwnChildSchema>;

const socialRating = z.enum(['C', 'U', 'S']).nullable().optional();

export const learningProfileSubjectSchema = z.object({
  subjectArea: z.string().trim().min(1).max(200),
  subSubject: z.string().trim().max(200).nullable().optional(),
  achievement: z.enum(['outstanding', 'high', 'expected', 'basic', 'limited']).nullable().optional(),
  effort: z.enum(['high', 'satisfactory', 'low']).nullable().optional(),
  teacherComment: z.string().trim().max(4000).nullable().optional(),
});

export const upsertLearningProfileSchema = z.object({
  termLabel: z.string().trim().min(1, 'Term is required').max(100),
  gradeLabel: z.string().trim().max(100).nullable().optional(),
  generalComment: z.string().trim().max(4000).nullable().optional(),
  wholeDaysAbsent: z.string().trim().max(200).nullable().optional(),
  partialDaysAbsent: z.string().trim().max(200).nullable().optional(),
  extraActivities: z.string().trim().max(2000).nullable().optional(),
  positiveAttitude: socialRating,
  respectsRightsOfOthers: socialRating,
  respectsClassSchoolRules: socialRating,
  worksWellIndependently: socialRating,
  showsInitiativeEnthusiasm: socialRating,
  helpsEncouragesOthers: socialRating,
  subjects: z.array(learningProfileSubjectSchema).max(50),
});
export type UpsertLearningProfileInput = z.infer<typeof upsertLearningProfileSchema>;

export const upsertLessonPlanSchema = z.object({
  className: z.string().trim().min(1, 'Class is required').max(100),
  weekLabel: z.string().trim().min(1, 'Week is required').max(100),
  subject: z.string().trim().max(200).nullable().optional(),
  title: z.string().trim().min(1, 'Title is required').max(300),
  description: z.string().trim().max(4000).nullable().optional(),
});
export type UpsertLessonPlanInput = z.infer<typeof upsertLessonPlanSchema>;

const TIME_HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const classScheduleSchema = z
  .object({
    className: z.string().trim().min(1, 'Class is required').max(100),
    subject: z.string().trim().min(1, 'Subject is required').max(200),
    teacherId: z.coerce.number().int().positive().nullable().optional(),
    dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    startTime: z.string().trim().regex(TIME_HHMM, 'Use HH:MM'),
    endTime: z.string().trim().regex(TIME_HHMM, 'Use HH:MM'),
    format: z.enum(['online', 'in_person']),
    locationOrLink: z.string().trim().max(500).nullable().optional(),
  })
  .refine((v) => v.endTime > v.startTime, { message: 'End time must be after start time', path: ['endTime'] });
export type ClassScheduleInput = z.infer<typeof classScheduleSchema>;

export const createWorkSampleSchema = z.object({
  childId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, 'Title is required').max(300),
  fileUrl: z.string().trim().url().max(2000),
});
export type CreateWorkSampleInput = z.infer<typeof createWorkSampleSchema>;

export const createPhotoFeedItemSchema = z.object({
  fileUrl: z.string().trim().url().max(2000),
  caption: z.string().trim().max(1000).nullable().optional(),
  className: z.string().trim().max(100).nullable().optional(),
  childIds: z.array(z.coerce.number().int().positive()).max(20).default([]),
});
export type CreatePhotoFeedItemInput = z.infer<typeof createPhotoFeedItemSchema>;

export const createResourceSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  description: z.string().trim().max(2000).nullable().optional(),
  fileUrl: z.string().trim().url().max(2000),
  classBand: z.enum(['early_years', 'kindergarten', 'primary', 'secondary']).nullable().optional(),
});
export type CreateResourceInput = z.infer<typeof createResourceSchema>;

export const upsertCurriculumUnitSchema = z.object({
  className: z.string().trim().min(1, 'Class is required').max(100),
  termLabel: z.string().trim().min(1, 'Term is required').max(100),
  unitTitle: z.string().trim().min(1, 'Unit title is required').max(300),
  description: z.string().trim().max(4000).nullable().optional(),
});
export type UpsertCurriculumUnitInput = z.infer<typeof upsertCurriculumUnitSchema>;

export const linkGuardianSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  relationship: z.string().trim().max(100).nullable().optional(),
});
export type LinkGuardianInput = z.infer<typeof linkGuardianSchema>;

export const invoiceLineItemSchema = z.object({
  description: z.string().trim().min(1, 'Description is required').max(500),
  // Zero quantity/price is a valid, deliberate "informational" line item (e.g. "Lunches -
  // provided by parents") — matches how the real invoice template shows some rows with no
  // qty/price/total at all, rather than needing a separate freeform notes field for that.
  quantity: z.coerce.number().min(0).max(10000),
  unitPrice: z.coerce.number().int('Price must be a whole number of IDR').nonnegative().max(1_000_000_000),
});

export const invoiceChildSchema = z.object({
  childId: z.coerce.number().int().positive(),
  lineItems: z.array(invoiceLineItemSchema).min(1, 'Each child needs at least one line item'),
});

export const createInvoiceSchema = z.object({
  invoiceType: z.enum(['tuition', 'activity']),
  billedToName: z.string().trim().min(1, 'Billed-to name is required').max(200),
  issueDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid issue date'),
  notes: z.string().trim().max(2000).nullable().optional(),
  children: z.array(invoiceChildSchema).min(1, 'At least one child is required'),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['paid', 'outstanding', 'cancelled']),
});
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;

export const signComplianceFormSchema = z.object({
  signedByName: z.string().trim().min(1, 'Signed-by name is required').max(200),
  signatureDataUrl: z
    .string()
    .trim()
    .regex(/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/, 'Invalid signature image'),
});
export type SignComplianceFormInput = z.infer<typeof signComplianceFormSchema>;

export const sendComplianceFormSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export const letterOfOfferSchema = z.object({
  childId: z.coerce.number().int().positive(),
  startDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid start date'),
  programme: z.string().trim().max(200).nullable().optional(),
  className: z.string().trim().max(200).nullable().optional(),
  tuitionPlan: z.string().trim().max(500).nullable().optional(),
  feesNote: z.string().trim().max(2000).nullable().optional(),
  additionalTerms: z.string().trim().max(4000).nullable().optional(),
});
export type LetterOfOfferInput = z.infer<typeof letterOfOfferSchema>;

export const updateLetterOfOfferSchema = letterOfOfferSchema.omit({ childId: true });

export const sendLetterOfOfferSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export const acceptLetterOfOfferSchema = z.object({
  acceptedByName: z.string().trim().min(1, 'Enter your name').max(200),
});

export const scheduleMeetingSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

/** "Send off-boarding letter" — a single admin action (create + send), unlike Letter of Offer,
 * since there's no per-family content to draft/edit first: the letter is fixed copy plus the exit
 * survey link. */
export const sendOffboardingLetterSchema = z.object({
  childId: z.coerce.number().int().positive(),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

/** Manual "Send now" override on the Child Card — same create-or-resend semantics as the cron job
 * (see recordWelcomeLetterSent in welcome-letters.ts), just triggered by an admin instead of the
 * schedule. */
export const sendWelcomeLetterSchema = z.object({
  childId: z.coerce.number().int().positive(),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export const submitOffboardingSurveySchema = z.object({
  completedByName: z.string().trim().min(1, 'Enter your name').max(200),
  experienceRating: z.coerce.number().int().min(1, 'Choose a rating').max(5),
  recommendScore: z.coerce.number().int().min(0, 'Choose a score').max(10),
  marketingConsent: z.boolean(),
  feedbackText: z.string().trim().max(4000).nullable().optional(),
});

export const bookMeetingSlotSchema = z.object({
  startIso: z.string().trim().datetime({ message: 'Choose a valid time slot' }),
  format: z.enum(['in_person', 'video']),
  bookedByName: z.string().trim().min(1, 'Enter your name').max(200),
});

const lunchWeekdaysSchema = z
  .object({
    monday: z.boolean(),
    tuesday: z.boolean(),
    wednesday: z.boolean(),
    thursday: z.boolean(),
    friday: z.boolean(),
  })
  .refine((d) => d.monday || d.tuesday || d.wednesday || d.thursday || d.friday, { message: 'Select at least one day' });

export const createLunchOrderSchema = z
  .object({
    childId: z.coerce.number().int().positive(),
    startDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid start date'),
    endDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid end date'),
    weekdays: lunchWeekdaysSchema,
    lunchSize: z.enum(['normal', 'large']),
    foodPreference: z.string().trim().max(1000).nullable().optional(),
    allergiesNotes: z.string().trim().max(1000).nullable().optional(),
  })
  .refine((d) => d.endDate >= d.startDate, { message: 'End date must be on or after the start date', path: ['endDate'] });
export type CreateLunchOrderInput = z.infer<typeof createLunchOrderSchema>;

export const bringOwnLunchSchema = z.object({
  childId: z.coerce.number().int().positive(),
});

export const updateLunchSettingsSchema = z.object({
  supplierName: z.string().trim().max(300).optional(),
  supplierEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(320)
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, { message: 'Enter a valid email address' }),
  payableTo: z.string().trim().max(300).optional(),
  bankName: z.string().trim().max(300).optional(),
  accountNumber: z.string().trim().max(100).optional(),
  accountName: z.string().trim().max(300).optional(),
  swiftCode: z.string().trim().max(50).optional(),
  bankAddress: z.string().trim().max(500).nullable().optional(),
  bankCode: z.string().trim().max(50).nullable().optional(),
  branchCode: z.string().trim().max(50).nullable().optional(),
  clearingCode: z.string().trim().max(50).nullable().optional(),
  currency: z.string().trim().min(1).max(10).optional(),
  invoiceDueDays: z.coerce.number().int().min(0).max(365).optional(),
  normalPriceIdr: z.coerce.number().int().min(0).optional(),
  largePriceIdr: z.coerce.number().int().min(0).optional(),
});
export type UpdateLunchSettingsInput = z.infer<typeof updateLunchSettingsSchema>;

export const updateSchoolSettingsSchema = z.object({
  payableTo: z.string().trim().min(1).max(300).optional(),
  bankName: z.string().trim().min(1).max(300).optional(),
  accountNumber: z.string().trim().min(1).max(100).optional(),
  accountName: z.string().trim().min(1).max(300).optional(),
  swiftCode: z.string().trim().min(1).max(50).optional(),
  bankAddress: z.string().trim().max(500).nullable().optional(),
  bankCode: z.string().trim().max(50).nullable().optional(),
  branchCode: z.string().trim().max(50).nullable().optional(),
  clearingCode: z.string().trim().max(50).nullable().optional(),
  currency: z.string().trim().min(1).max(10).optional(),
  invoiceDueDays: z.coerce.number().int().min(0).max(365).optional(),
});
export type UpdateSchoolSettingsInput = z.infer<typeof updateSchoolSettingsSchema>;

export const studentLoginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required'),
});
export type StudentLoginInput = z.infer<typeof studentLoginSchema>;

export const adminChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(200),
});
export type AdminChangePasswordInput = z.infer<typeof adminChangePasswordSchema>;

export const customerSignupSchema = z.object({
  email,
  name: z.string().trim().min(1, 'Name is required').max(200),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
});
export type CustomerSignupInput = z.infer<typeof customerSignupSchema>;

export const customerLoginSchema = z.object({
  email,
});
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;

export const passPurchaseSchema = z.object({
  childName: z.string().trim().min(1, "Child's name is required").max(200),
  paymentMethod: z.enum(['pay_online', 'pay_at_session'], { message: 'Please choose a payment method' }),
});
export type PassPurchaseInput = z.infer<typeof passPurchaseSchema>;

export const emergencyContactSchema = z.object({
  emergencyContactName: z.string().trim().min(1, 'Emergency contact name is required').max(200),
  emergencyContactPhone: z.string().trim().min(1, 'Emergency contact phone is required').max(50),
});
export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>;

const isoDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date');

export const enrolmentSchema = z.object({
  studentName: z.string().trim().min(1, "Student's name is required").max(200),
  studentDob: isoDate,
  previousSchool: optionalText,
  previousGrade: z.string().trim().max(100).optional().or(z.literal('')),
  siblingsAttending: optionalText,

  startDate: isoDate,
  enrolmentLength: z.enum(['1_week', '1_month', '1_term', 'full_year', 'ongoing', 'other'], {
    message: 'Please choose the length of enrolment',
  }),
  enrolmentLengthOther: z.string().trim().max(200).optional().or(z.literal('')),

  kitasStatus: z.enum(['has_kitas', 'in_progress', 'not_applicable', 'other'], {
    message: "Please choose the student's KITAS status",
  }),
  kitasNotes: optionalText,
  passportNumber: z.string().trim().max(100).optional().or(z.literal('')),
  passportNationality: z.string().trim().max(100).optional().or(z.literal('')),
  passportExpiry: isoDate.optional().or(z.literal('')),

  photographyConsent: z.enum(['yes', 'no'], { message: 'Please choose a photography consent option' }),
  medicalConditions: optionalText,
  allergies: optionalText,

  lunchOption: z.enum(['bring_own', 'godspeed', 'other'], { message: 'Please choose a lunch option' }),
  lunchOtherNotes: optionalText,

  shuttleService: z.enum(['yes', 'no'], { message: 'Please choose whether you need the shuttle service' }),

  emergencyContactName: z.string().trim().min(1, 'Emergency contact name is required').max(200),
  emergencyContactPhone: z.string().trim().min(1, 'Emergency contact phone is required').max(50),
  authorizedPickup: optionalText,

  parentName: z.string().trim().min(1, "Parent/guardian name is required").max(200),
  parentEmail: email,
  parentWhatsapp: phone,
});
export type EnrolmentInput = z.infer<typeof enrolmentSchema>;

// --- Attendance ---

const attendanceCheckBase = z.object({
  // coerce, not number: children.id/activities.id are BIGINT columns, which the Postgres driver
  // returns as strings (to avoid precision loss past Number.MAX_SAFE_INTEGER) — every ID prop
  // passed down from a server-fetched row is therefore a string at runtime despite its `number`
  // TS type, same as every other childId schema in this file (see z.coerce.number() above).
  childId: z.coerce.number().int().positive(),
  eventType: z.enum(['check_in', 'check_out']),
  sessionType: z.enum(['daily', 'activity']),
  activityId: z.coerce.number().int().positive().nullable().optional(),
});

/** Shared shape for both the kiosk (no session) and the parent portal (session-scoped) check
 * routes — an 'activity' session requires an activityId, a 'daily' one must not carry one, so the
 * roster and the request always agree on what's being recorded. A signature is always required
 * here (that's the whole point of this schema vs. adminAttendanceCorrectionSchema below, which is
 * the signature-free admin override) — drawn on a <canvas> and shipped as a PNG data URL, same
 * format as the existing compliance-form signatures.
 * `signedByName` is optional at the schema level: the kiosk route requires it explicitly (there's
 * no login to fall back on), while the parent-portal route ignores whatever's sent and fills it in
 * itself from the logged-in customer's own name — never trusting the client for that. */
export const attendanceCheckSchema = attendanceCheckBase
  .extend({
    signatureDataUrl: z
      .string()
      .trim()
      .min(1, 'A signature is required')
      .refine((v) => v.startsWith('data:image/'), { message: 'Invalid signature.' }),
    signedByName: z.string().trim().max(200).optional(),
  })
  .refine((d) => (d.sessionType === 'activity' ? d.activityId != null : d.activityId == null), {
    message: 'Activity check-ins require an activity; daily check-ins must not include one.',
    path: ['activityId'],
  });
export type AttendanceCheckInput = z.infer<typeof attendanceCheckSchema>;

/** The kiosk's own admin-override check-in/out (/api/kiosk/admin-check) — same shape as
 * attendanceCheckSchema minus the signature, since the whole point is skipping it. Distinct from
 * adminAttendanceCorrectionSchema below: that one is for the Child Card's backdated corrections
 * (childId from the URL, a chosen occurredAt); this one is "right now, from the gate", with
 * childId in the body since the kiosk isn't scoped to one child's page. */
export const kioskAdminCheckSchema = attendanceCheckBase.refine(
  (d) => (d.sessionType === 'activity' ? d.activityId != null : d.activityId == null),
  { message: 'Activity check-ins require an activity; daily check-ins must not include one.', path: ['activityId'] }
);
export type KioskAdminCheckInput = z.infer<typeof kioskAdminCheckSchema>;

export const linkChildSearchSchema = z.object({
  childFullName: z.string().trim().min(1, "Enter your child's full name").max(200),
  dob: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date of birth'),
});
export type LinkChildSearchInput = z.infer<typeof linkChildSearchSchema>;

export const linkChildRequestSchema = z.object({
  childId: z.coerce.number().int().positive(),
  relationship: z.string().trim().max(100).optional(),
});
export type LinkChildRequestInput = z.infer<typeof linkChildRequestSchema>;

export const reviewGuardianRequestSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
});
export type ReviewGuardianRequestInput = z.infer<typeof reviewGuardianRequestSchema>;

// childId omitted: the correction route (/api/admin/children/[id]/attendance) always takes it
// from the URL param, never the body.
export const adminAttendanceCorrectionSchema = attendanceCheckBase.omit({ childId: true }).extend({
  occurredAt: z.string().trim().min(1, 'Enter a date and time'),
});
export type AdminAttendanceCorrectionInput = z.infer<typeof adminAttendanceCorrectionSchema>;
