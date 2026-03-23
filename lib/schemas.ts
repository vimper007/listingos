import { isValidPhoneNumber } from 'libphonenumber-js'
import { z } from 'zod'

const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone is required')
  .refine(
    (value) => {
      try {
        return isValidPhoneNumber(value)
      } catch {
        return false
      }
    },
    'Enter a valid phone number with country code (e.g. +1 555 000 0000)'
  )

const descriptionSchema = z.string().trim().max(2000, 'Description is too long').optional()

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  phone: phoneSchema,
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const newListingSchema = z.object({
  address: z.string().trim().min(5, 'Enter a full address'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  bedrooms: z.coerce.number().int('Bedrooms must be a whole number').min(1, 'At least 1 bedroom'),
  bathrooms: z.coerce.number().int('Bathrooms must be a whole number').min(1, 'At least 1 bathroom'),
  square_footage: z.coerce
    .number()
    .int('Square footage must be a whole number')
    .positive('Square footage must be greater than 0'),
  features: z.array(z.string()).max(20, 'Too many features selected'),
  description: descriptionSchema,
})

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  phone: phoneSchema,
  bio: z.string().trim().max(2000, 'Bio is too long').optional(),
  brand_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color e.g. #1a2e4a'),
})

export const generateListingRequestSchema = newListingSchema.extend({
  agent_id: z.string().uuid('Invalid agent id'),
  photo_urls: z.array(z.string().url('Photo URLs must be valid')).max(10, 'Maximum 10 photos'),
  description: descriptionSchema.nullable().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type NewListingFormInput = z.input<typeof newListingSchema>
export type NewListingFormData = z.infer<typeof newListingSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
export type GenerateListingRequestData = z.infer<typeof generateListingRequestSchema>
