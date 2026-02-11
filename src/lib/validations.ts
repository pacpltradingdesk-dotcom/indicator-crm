import { z } from 'zod'
import { LEAD_STAGES, LEAD_TEMPERATURES, LEAD_SOURCES, AUTOMATION_TRIGGERS, AUTOMATION_STEP_TYPES, TEMPLATE_CATEGORIES } from './constants'

// ─── Customer ─────────────────────────────────────────
export const createCustomerSchema = z.object({
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15),
  name: z.string().max(100).optional(),
  email: z.string().email('Invalid email').max(255).optional().or(z.literal('')),
  source: z.enum(LEAD_SOURCES).optional(),
  leadStage: z.enum(LEAD_STAGES).optional(),
  leadTemperature: z.enum(LEAD_TEMPERATURES).optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string()).optional(),
})

export const updateCustomerSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email('Invalid email').max(255).optional().or(z.literal('')),
  leadStage: z.enum(LEAD_STAGES).optional(),
  leadTemperature: z.enum(LEAD_TEMPERATURES).optional(),
  leadScore: z.number().min(0).max(100).optional(),
  notes: z.string().max(5000).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  tags: z.array(z.string()).optional(),
})

// ─── Message ──────────────────────────────────────────
export const sendMessageSchema = z.object({
  customerId: z.string().min(1),
  content: z.string().min(1, 'Message cannot be empty').max(4096),
  type: z.enum(['TEXT', 'TEMPLATE']).optional(),
  templateName: z.string().optional(),
  templateParams: z.array(z.string()).optional(),
})

// ─── Payment ──────────────────────────────────────────
export const createPaymentSchema = z.object({
  customerId: z.string().min(1),
  amount: z.number().positive('Amount must be positive').max(10000000),
  currency: z.string().default('INR'),
  status: z.enum(['CREATED', 'AUTHORIZED', 'CAPTURED']).optional(),
  method: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  productId: z.string().optional(),
})

// ─── Product ──────────────────────────────────────────
export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive('Price must be positive').max(10000000),
  currency: z.string().default('INR'),
  isActive: z.boolean().optional(),
  category: z.string().max(100).optional(),
  features: z.array(z.string()).optional(),
})

export const updateProductSchema = createProductSchema.partial()

// ─── Automation ───────────────────────────────────────
export const createAutomationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  trigger: z.enum(AUTOMATION_TRIGGERS),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
  steps: z.array(z.object({
    type: z.enum(AUTOMATION_STEP_TYPES),
    config: z.record(z.string(), z.unknown()).optional(),
    order: z.number().int().min(0),
  })).optional(),
})

export const updateAutomationSchema = createAutomationSchema.partial()

// ─── Tag ──────────────────────────────────────────────
export const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color hex').optional(),
})

// ─── Template ─────────────────────────────────────────
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  language: z.string().default('en'),
  category: z.enum(TEMPLATE_CATEGORIES).optional(),
  content: z.string().min(1, 'Content is required').max(4096),
  headerType: z.string().max(50).optional(),
  headerContent: z.string().max(500).optional(),
  footerContent: z.string().max(200).optional(),
  buttons: z.array(z.record(z.string(), z.unknown())).optional(),
  variables: z.array(z.string()).optional(),
})

// ─── Settings ─────────────────────────────────────────
const ALLOWED_SETTINGS_KEYS = [
  'whatsapp_access_token', 'whatsapp_phone_number_id', 'whatsapp_business_account_id', 'whatsapp_verify_token',
  'razorpay_key_id', 'razorpay_key_secret', 'razorpay_webhook_secret',
  'openai_api_key',
  'business_name', 'business_phone', 'business_email',
  'auto_reply_enabled', 'ai_scoring_enabled',
] as const

export const updateSettingSchema = z.object({
  key: z.enum(ALLOWED_SETTINGS_KEYS),
  value: z.string().max(2000),
})

// ─── Bulk Operations ──────────────────────────────────
export const bulkUpdateSchema = z.object({
  customerIds: z.array(z.string()).min(1).max(100),
  action: z.enum(['CHANGE_STAGE', 'CHANGE_TEMPERATURE', 'ADD_TAG', 'REMOVE_TAG', 'DELETE']),
  value: z.string().optional(),
})

// ─── Helper ───────────────────────────────────────────
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T; error: null } | { success: false; data: null; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const messages = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
    return { success: false, data: null, error: messages }
  }
  return { success: true, data: result.data, error: null }
}
