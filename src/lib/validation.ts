import { z } from 'zod';

/**
 * Shared validation schemas for input sanitization and validation
 * Used across forms and edge functions for consistent security
 */

// Name validation: 1-100 characters, letters, spaces, hyphens, and common unicode
export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[\p{L}\p{M}\s\-'\.]+$/u, 'Name contains invalid characters');

// Email validation: standard email format, max 255 characters
export const emailSchema = z
  .string()
  .trim()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase();

// Phone validation: E.164 format or common formats with optional country code
export const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
    'Invalid phone number format'
  )
  .min(10, 'Phone number must be at least 10 digits')
  .max(20, 'Phone number must be less than 20 characters');

// Optional phone schema
export const phoneOptionalSchema = z
  .string()
  .trim()
  .regex(
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
    'Invalid phone number format'
  )
  .min(10, 'Phone number must be at least 10 digits')
  .max(20, 'Phone number must be less than 20 characters')
  .optional()
  .or(z.literal(''));

// City validation: 2-100 characters, letters, spaces, hyphens, and common unicode
export const citySchema = z
  .string()
  .trim()
  .min(2, 'City must be at least 2 characters')
  .max(100, 'City must be less than 100 characters')
  .regex(/^[\p{L}\p{M}\s\-'\.]+$/u, 'City contains invalid characters');

// Payment form validation schema
export const paymentFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneOptionalSchema,
});

// Subscription form validation schema (with required phone)
export const subscriptionFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  city: citySchema,
});

// Simple subscription form (email + name only)
export const simpleSubscriptionSchema = z.object({
  name: nameSchema,
  email: emailSchema,
});

// Mailchimp subscription request schema
export const mailchimpSubscribeSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  city: citySchema.optional(),
  phone: phoneOptionalSchema,
  source: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

// Create payment request schema
export const createPaymentSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneOptionalSchema,
  program: z.enum([
    'courageous-character',
    'money-literacy',
    'business-startup',
    'business-growth',
  ]),
});

// Verify payment request schema
export const verifyPaymentSchema = z.object({
  sessionId: z.string().trim().min(1).max(500),
});

// Type exports for TypeScript inference
export type PaymentFormData = z.infer<typeof paymentFormSchema>;
export type SubscriptionFormData = z.infer<typeof subscriptionFormSchema>;
export type SimpleSubscriptionData = z.infer<typeof simpleSubscriptionSchema>;
export type MailchimpSubscribeData = z.infer<typeof mailchimpSubscribeSchema>;
export type CreatePaymentData = z.infer<typeof createPaymentSchema>;
export type VerifyPaymentData = z.infer<typeof verifyPaymentSchema>;
