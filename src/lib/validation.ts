import { z } from 'zod';

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
