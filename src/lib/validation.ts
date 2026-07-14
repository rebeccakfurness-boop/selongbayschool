import { z } from 'zod';

const name = z.string().trim().min(1, 'Name is required').max(200);
const email = z.string().trim().email('Enter a valid email address').max(320);
const phone = z.string().trim().min(1, 'Phone number is required').max(50);
const optionalText = z.string().trim().max(4000).optional().or(z.literal(''));

export const contactSchema = z.object({
  name,
  email,
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  message: z.string().trim().min(1, 'Please add a short message').max(4000),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const admissionsSchema = z.object({
  name,
  email,
  phone,
  childName: z.string().trim().min(1, "Child's name is required").max(200),
  childAge: z.string().trim().min(1, "Child's age is required").max(50),
  message: optionalText,
  interest: z.string().trim().max(200).optional().or(z.literal('')),
});
export type AdmissionsInput = z.infer<typeof admissionsSchema>;

export const highSchoolSchema = z.object({
  name,
  email,
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  message: optionalText,
});
export type HighSchoolInput = z.infer<typeof highSchoolSchema>;

export const bookingSchema = z.object({
  slotId: z.coerce.number().int().positive(),
  childName: z.string().trim().min(1, "Child's name is required").max(200),
  childAge: z.string().trim().min(1, "Child's age is required").max(50),
  parentName: z.string().trim().min(1, 'Parent name is required').max(200),
  parentEmail: email,
  parentPhone: phone,
  emergencyContact: z.string().trim().min(1, 'Emergency contact is required').max(200),
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
