// ─── Lead Stages ──────────────────────────────────────
export const LEAD_STAGES = ['NEW', 'ENGAGED', 'INTERESTED', 'NEGOTIATION', 'CONVERTED', 'CHURNED'] as const
export type LeadStage = (typeof LEAD_STAGES)[number]

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  NEW: 'New',
  ENGAGED: 'Engaged',
  INTERESTED: 'Interested',
  NEGOTIATION: 'Negotiation',
  CONVERTED: 'Converted',
  CHURNED: 'Churned',
}

// ─── Lead Temperatures ────────────────────────────────
export const LEAD_TEMPERATURES = ['HOT', 'WARM', 'COLD', 'DEAD'] as const
export type LeadTemperature = (typeof LEAD_TEMPERATURES)[number]

export const LEAD_TEMPERATURE_LABELS: Record<LeadTemperature, string> = {
  HOT: 'Hot',
  WARM: 'Warm',
  COLD: 'Cold',
  DEAD: 'Dead',
}

// ─── Lead Sources ─────────────────────────────────────
export const LEAD_SOURCES = ['WHATSAPP', 'RAZORPAY', 'MANUAL', 'WEBSITE'] as const
export type LeadSource = (typeof LEAD_SOURCES)[number]

// ─── Message Direction ────────────────────────────────
export const MESSAGE_DIRECTIONS = ['INBOUND', 'OUTBOUND'] as const
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number]

// ─── Message Types ────────────────────────────────────
export const MESSAGE_TYPES = ['TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO', 'LOCATION', 'INTERACTIVE', 'TEMPLATE'] as const
export type MessageType = (typeof MESSAGE_TYPES)[number]

// ─── Message Status ───────────────────────────────────
export const MESSAGE_STATUSES = ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'] as const
export type MessageStatus = (typeof MESSAGE_STATUSES)[number]

// ─── Payment Status ───────────────────────────────────
export const PAYMENT_STATUSES = ['CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

// ─── User Roles ───────────────────────────────────────
export const USER_ROLES = ['AGENT', 'ADMIN'] as const
export type UserRole = (typeof USER_ROLES)[number]

// ─── Activity Types ───────────────────────────────────
export const ACTIVITY_TYPES = [
  'CUSTOMER_CREATED',
  'CUSTOMER_UPDATED',
  'MESSAGE_RECEIVED',
  'MESSAGE_SENT',
  'PAYMENT_RECEIVED',
  'AUTOMATION_TRIGGERED',
  'AI_ANALYSIS',
  'TAG_ADDED',
  'STAGE_CHANGED',
  'NOTE_ADDED',
  'FOLLOW_UP_SCHEDULED',
] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

// ─── Automation Triggers ──────────────────────────────
export const AUTOMATION_TRIGGERS = ['CUSTOMER_CREATED', 'MESSAGE_RECEIVED', 'PAYMENT_RECEIVED', 'MANUAL'] as const
export type AutomationTrigger = (typeof AUTOMATION_TRIGGERS)[number]

// ─── Automation Step Types ────────────────────────────
export const AUTOMATION_STEP_TYPES = [
  'SEND_TEXT',
  'SEND_TEMPLATE',
  'WAIT',
  'WAIT_FOR_REPLY',
  'ADD_TAG',
  'CHANGE_STAGE',
  'AI_ANALYZE',
  'NOTIFY_ADMIN',
  'SCHEDULE_CALL',
  'CONDITIONAL_BRANCH',
] as const
export type AutomationStepType = (typeof AUTOMATION_STEP_TYPES)[number]

// ─── Workflow Run Status ──────────────────────────────
export const WORKFLOW_STATUSES = ['RUNNING', 'PAUSED', 'WAITING', 'COMPLETED', 'FAILED'] as const
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number]

// ─── Follow Up Types ──────────────────────────────────
export const FOLLOW_UP_TYPES = ['WHATSAPP_MESSAGE', 'CALL_REMINDER'] as const
export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number]

// ─── Template Categories ──────────────────────────────
export const TEMPLATE_CATEGORIES = ['MARKETING', 'UTILITY', 'AUTHENTICATION'] as const
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]

// ─── Preferred Markets ────────────────────────────────
export const PREFERRED_MARKETS = ['Nifty', 'BankNifty', 'Sensex', 'Crude', 'Gold', 'Forex', 'Crypto'] as const

// ─── Pagination ───────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 200
