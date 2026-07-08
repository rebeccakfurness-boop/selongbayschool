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
