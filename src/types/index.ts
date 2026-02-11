import type { LeadStage, LeadTemperature, LeadSource, MessageDirection, MessageType, MessageStatus, PaymentStatus, UserRole, ActivityType, AutomationTrigger, AutomationStepType, WorkflowStatus } from '@/lib/constants'

// ─── User ─────────────────────────────────────────────
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─── Customer ─────────────────────────────────────────
export interface Customer {
  id: string
  phone: string
  name?: string | null
  email?: string | null
  source: LeadSource
  leadStage: LeadStage
  leadTemperature: LeadTemperature
  leadScore: number
  aiSummary?: string | null
  tradingExperience?: string | null
  interestedProducts: string
  preferredMarkets: string
  totalMessages: number
  totalSpent: number
  lastMessageAt?: string | null
  lastPaymentAt?: string | null
  whatsappId?: string | null
  profilePicUrl?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  tags?: CustomerTagWithTag[]
  _count?: { messages: number; payments: number }
}

// ─── Tag ──────────────────────────────────────────────
export interface Tag {
  id: string
  name: string
  color: string
  isAiGenerated: boolean
  createdAt: string
}

export interface CustomerTagWithTag {
  id: string
  customerId: string
  tagId: string
  aiConfidence?: number | null
  tag: Tag
}

// ─── Message ──────────────────────────────────────────
export interface Message {
  id: string
  customerId: string
  direction: MessageDirection
  type: MessageType
  content: string
  mediaUrl?: string | null
  whatsappMsgId?: string | null
  status: MessageStatus
  templateName?: string | null
  metadata?: string | null
  createdAt: string
  updatedAt: string
}

// ─── Payment ──────────────────────────────────────────
export interface Payment {
  id: string
  customerId: string
  productId?: string | null
  razorpayPaymentId?: string | null
  razorpayOrderId?: string | null
  amount: number
  currency: string
  status: PaymentStatus
  method?: string | null
  email?: string | null
  phone?: string | null
  description?: string | null
  metadata?: string | null
  paidAt?: string | null
  createdAt: string
  updatedAt: string
  customer?: Customer
  product?: Product | null
}

// ─── Product ──────────────────────────────────────────
export interface Product {
  id: string
  name: string
  description?: string | null
  price: number
  currency: string
  isActive: boolean
  category?: string | null
  features: string
  createdAt: string
  updatedAt: string
}

// ─── Automation ───────────────────────────────────────
export interface Automation {
  id: string
  name: string
  description?: string | null
  trigger: AutomationTrigger
  triggerConfig?: string | null
  isActive: boolean
  isTemplate: boolean
  createdAt: string
  updatedAt: string
  steps?: AutomationStep[]
  _count?: { runs: number }
}

export interface AutomationStep {
  id: string
  automationId: string
  type: AutomationStepType
  config: string
  order: number
  nextStepId?: string | null
  conditionTrue?: string | null
  conditionFalse?: string | null
  createdAt: string
}

// ─── Workflow ─────────────────────────────────────────
export interface WorkflowRun {
  id: string
  automationId: string
  customerId: string
  status: WorkflowStatus
  currentStepId?: string | null
  context?: string | null
  startedAt: string
  completedAt?: string | null
  error?: string | null
}

// ─── Activity ─────────────────────────────────────────
export interface Activity {
  id: string
  type: ActivityType
  description: string
  customerId?: string | null
  userId?: string | null
  metadata?: string | null
  createdAt: string
  customer?: { name: string | null; phone: string } | null
}

// ─── Message Template ─────────────────────────────────
export interface MessageTemplate {
  id: string
  name: string
  language: string
  category: string
  content: string
  headerType?: string | null
  headerContent?: string | null
  footerContent?: string | null
  buttons?: string | null
  variables: string
  isApproved: boolean
  whatsappId?: string | null
  createdAt: string
  updatedAt: string
}

// ─── Analytics ────────────────────────────────────────
export interface DashboardStats {
  totalCustomers: number
  hotLeads: number
  convertedCustomers: number
  totalRevenue: number
  monthlyRevenue: number
  activeConversations: number
  newLeadsThisWeek: number
}

export interface AnalyticsData {
  stats: DashboardStats
  leadFunnel: { stage: string; count: number }[]
  sourceDistribution: { source: string; count: number }[]
  revenueOverTime: { date: string; revenue: number }[]
  stageDistribution: { stage: string; count: number }[]
  recentActivities: Activity[]
}

// ─── API Response ─────────────────────────────────────
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
