# Indicator CRM - Project Handover Document

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Codebase Map](#codebase-map)
4. [Database Schema](#database-schema)
5. [Authentication Flow](#authentication-flow)
6. [API Security Layers](#api-security-layers)
7. [WhatsApp Integration](#whatsapp-integration)
8. [Razorpay Integration](#razorpay-integration)
9. [AI Scoring System](#ai-scoring-system)
10. [Automation Engine](#automation-engine)
11. [Real-time Updates (SSE)](#real-time-updates)
12. [Background Workers](#background-workers)
13. [Environment Setup](#environment-setup)
14. [Common Tasks](#common-tasks)
15. [Troubleshooting](#troubleshooting)

---

## 1. Project Overview

**Indicator CRM** is a customer relationship management system designed for trading indicator sellers (TradingView Pine Script). It handles the full sales pipeline:

```
Website/WhatsApp Lead → AI Scoring → Nurture via Chat → Payment → Conversion
```

**Target Users**: Trading indicator businesses selling to Indian traders (Nifty, BankNifty, Sensex markets).

**Core Workflow**:
1. Leads come in via WhatsApp messages, website forms, or manual entry
2. AI automatically scores and classifies leads
3. Sales agents chat with leads via WhatsApp
4. Automation workflows nurture leads automatically
5. Payments are processed via Razorpay
6. Dashboard shows pipeline analytics

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  Next.js 14 App Router + React 18 + Tailwind CSS    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │Dashboard │ │ Chat     │ │ Leads    │  ...more    │
│  │(Charts)  │ │(WhatsApp)│ │(Kanban)  │  pages      │
│  └──────────┘ └──────────┘ └──────────┘            │
├─────────────────────────────────────────────────────┤
│                    API LAYER                         │
│  Next.js API Routes (19 endpoints)                  │
│  Auth Guard → Rate Limit → Zod Validation → Logic   │
├─────────────────────────────────────────────────────┤
│                    SERVICES                          │
│  ┌───────────┐  ┌─────────────┐  ┌──────────┐     │
│  │ WhatsApp  │  │ AI Scoring  │  │ Analytics│     │
│  │ Client    │  │ (OpenAI)    │  │ Service  │     │
│  └───────────┘  └─────────────┘  └──────────┘     │
├─────────────────────────────────────────────────────┤
│                    DATA LAYER                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Prisma   │  │  Redis   │  │  SSE     │         │
│  │ (SQLite) │  │ (BullMQ) │  │ Manager  │         │
│  └──────────┘  └──────────┘  └──────────┘         │
├─────────────────────────────────────────────────────┤
│                 EXTERNAL SERVICES                    │
│  WhatsApp Cloud API │ Razorpay │ OpenAI GPT-4o-mini │
└─────────────────────────────────────────────────────┘
```

---

## 3. Codebase Map

### Key Files You'll Touch Most Often

| File | Purpose | When to modify |
|------|---------|----------------|
| `prisma/schema.prisma` | Database models | Adding new fields/models |
| `src/lib/constants.ts` | Business logic enums | Adding new stages/sources |
| `src/lib/validations.ts` | Input validation rules | Changing API validation |
| `src/app/api/*/route.ts` | API endpoints | Modifying backend logic |
| `src/app/(dashboard)/*/page.tsx` | UI pages | Changing frontend |
| `src/services/ai-scoring.service.ts` | AI prompt & scoring | Tweaking AI behavior |
| `src/workers/automation.worker.ts` | Workflow execution | Adding new step types |
| `src/lib/whatsapp.ts` | WhatsApp API calls | Fixing messaging issues |

### File Naming Conventions

- `route.ts` - API endpoints (Next.js convention)
- `page.tsx` - Page components (Next.js convention)
- `loading.tsx` - Loading states
- `error.tsx` - Error boundaries
- `*.service.ts` - Business logic services
- `*.worker.ts` - Background job processors

---

## 4. Database Schema

### Entity Relationship Diagram

```
User (admin/agent)
  │
  ├── Activity (audit log)
  └── ScheduledFollowUp

Customer (lead/customer)
  │
  ├── CustomerTag ──── Tag
  ├── Message (WhatsApp history)
  ├── Payment ──── Product
  ├── WorkflowRun ──── Automation
  │     └── WorkflowRunLog ──── AutomationStep
  ├── ScheduledFollowUp
  └── Activity

Automation
  └── AutomationStep (ordered steps)

SystemSetting (key-value config)
MessageTemplate (WhatsApp templates)
```

### Key Indexes (Performance)

```sql
Customer: leadStage, leadTemperature, source, leadScore, createdAt, lastMessageAt
Message: customerId, (customerId + createdAt)
Payment: customerId, status
Activity: customerId, createdAt, type
WorkflowRun: customerId, status
```

---

## 5. Authentication Flow

```
Login Page → POST /api/auth/callback/credentials
           → NextAuth verifies email+password (bcrypt)
           → JWT token created with { id, name, email, role }
           → Stored in HTTP-only cookie
           → All API routes check via requireAuth()
           → Settings routes check via requireAdmin()
```

**Roles**: `ADMIN` (full access) and `AGENT` (no settings access)

---

## 6. API Security Layers

Every API request passes through 3 layers:

```
Request → Auth Check → Rate Limit → Zod Validation → Business Logic → Response
          (401/403)    (429)         (400)
```

**Rate Limits** (per IP, in-memory):
- API routes: 100 requests/minute
- Message sending: 30/minute
- AI analysis: 10/minute
- Webhooks: 200/minute
- Auth attempts: 10/15 minutes

---

## 7. WhatsApp Integration

### Setup Requirements
1. Meta Business account
2. WhatsApp Business Cloud API access
3. Phone number registered on WhatsApp Business Platform
4. Access token from Meta Developer portal

### Message Flow

```
INBOUND:
  Customer sends WhatsApp message
  → Meta webhook hits POST /api/webhooks/whatsapp
  → Message stored in DB
  → Customer created/updated
  → SSE broadcast to frontend
  → Automation triggers checked

OUTBOUND:
  Agent types message in Chat UI
  → POST /api/messages
  → WhatsApp Cloud API called
  → Message stored with status SENT
  → Status updates via webhook (DELIVERED → READ)
```

### Webhook Configuration

Set these in your Meta Developer Console:
- **Webhook URL**: `https://yourdomain.com/api/webhooks/whatsapp`
- **Verify Token**: Value from `WHATSAPP_VERIFY_TOKEN` env var
- **Subscribed Fields**: `messages`, `message_status`

---

## 8. Razorpay Integration

### Payment Flow

```
1. Agent creates payment link (or uses Razorpay dashboard)
2. Customer pays via Razorpay
3. Razorpay webhook hits POST /api/webhooks/razorpay
4. Webhook verifies signature
5. Payment record created in DB
6. Customer totalSpent updated
7. Automation trigger: PAYMENT_RECEIVED fires
8. Activity logged
```

### Webhook Configuration

In Razorpay Dashboard > Settings > Webhooks:
- **URL**: `https://yourdomain.com/api/webhooks/razorpay`
- **Secret**: Value from `RAZORPAY_WEBHOOK_SECRET`
- **Events**: `payment.captured`

---

## 9. AI Scoring System

### How It Works

```
Customer has 3+ messages
  → AI Analysis triggered (auto or manual)
  → Last 20 messages sent to GPT-4o-mini
  → AI returns: score, temperature, summary, tags, interests
  → Customer record updated
  → Tags auto-applied
  → Activity logged
```

### AI Prompt Context

The AI prompt includes:
- Customer's message history
- Available products catalog
- Target markets (Indian trading markets)
- Scoring criteria (0-100)

### Customizing AI Behavior

Edit `src/services/ai-scoring.service.ts` to:
- Change the scoring prompt
- Adjust temperature thresholds
- Modify auto-tag categories
- Add new analysis fields

---

## 10. Automation Engine

### Step Types

| Step | Config | Description |
|------|--------|-------------|
| `SEND_TEXT` | `{ message }` | Send WhatsApp text (supports variables like `{{name}}`) |
| `SEND_TEMPLATE` | `{ templateName, params }` | Send approved WhatsApp template |
| `WAIT` | `{ duration, unit }` | Pause for minutes/hours/days |
| `WAIT_FOR_REPLY` | `{ timeout }` | Pause until customer replies |
| `ADD_TAG` | `{ tagName }` | Apply tag to customer |
| `CHANGE_STAGE` | `{ stage }` | Update lead stage |
| `AI_ANALYZE` | `{}` | Run AI scoring |
| `NOTIFY_ADMIN` | `{ message }` | Create admin notification |
| `SCHEDULE_CALL` | `{ message, delay }` | Schedule follow-up reminder |
| `CONDITIONAL_BRANCH` | `{ field, operator, value }` | If/then branching |

### Execution Flow

```
Trigger fires (e.g., CUSTOMER_CREATED)
  → WorkflowRun created with status RUNNING
  → Worker picks up job from BullMQ
  → Executes steps sequentially
  → On WAIT: re-queues with delay
  → On WAIT_FOR_REPLY: status → WAITING
  → On completion: status → COMPLETED
  → Each step logged in WorkflowRunLog
```

---

## 11. Real-time Updates

Uses **Server-Sent Events (SSE)** for pushing updates to frontend:

```javascript
// Frontend connects
const es = new EventSource('/api/sse?channel=chat')
es.addEventListener('new-message', (e) => { /* update UI */ })
es.addEventListener('message-status', (e) => { /* update status */ })

// Backend broadcasts
sseManager.broadcast('chat', 'new-message', messageData)
```

**Channels**: `chat`, `default`
**Heartbeat**: Every 30 seconds

---

## 12. Background Workers

Requires Redis running on `REDIS_URL`.

```bash
# Start Redis
docker compose up -d redis

# Start workers
npm run worker
```

**Workers**:
1. `automation.worker.ts` - Executes workflow steps
2. `ai-analysis.worker.ts` - Background AI scoring

Workers use BullMQ queues with retry logic and error handling.

---

## 13. Environment Setup

### Development (SQLite - no Docker needed)

```bash
# .env
DATABASE_URL="file:./dev.db"
```

### Production (PostgreSQL + Redis)

```bash
# .env
DATABASE_URL="postgresql://user:pass@host:5432/indicator_crm"
REDIS_URL="redis://host:6379"
```

### Switching Database

1. Update `DATABASE_URL` in `.env`
2. Update `provider` in `prisma/schema.prisma` (sqlite → postgresql)
3. Run `npm run db:push`

---

## 14. Common Tasks

### Add a new field to Customer

1. Add field in `prisma/schema.prisma` → Customer model
2. Run `npm run db:push && npm run db:generate`
3. Add to `updateCustomerSchema` in `src/lib/validations.ts`
4. Add to PATCH handler in `src/app/api/customers/[id]/route.ts`
5. Add to UI in `src/app/(dashboard)/customers/[id]/page.tsx`

### Add a new automation step type

1. Add to `AUTOMATION_STEP_TYPES` in `src/lib/constants.ts`
2. Add handler in `src/workers/automation.worker.ts` switch statement
3. Add UI config in automation builder page

### Add a new API endpoint

1. Create `src/app/api/your-endpoint/route.ts`
2. Add `requireAuth()` guard
3. Add `checkRateLimit()` call
4. Add Zod schema in `validations.ts` (if POST/PATCH)
5. Add `validateBody()` call

### Change AI scoring behavior

Edit `src/services/ai-scoring.service.ts`:
- Modify the system prompt for different scoring criteria
- Change temperature thresholds (default: 70+ HOT, 40+ WARM, <40 COLD)
- Add new analysis fields to the JSON response schema

---

## 15. Troubleshooting

### "Unauthorized" on all API calls
- Check if NextAuth session cookie exists
- Verify `NEXTAUTH_SECRET` matches between restarts
- Check if user is active (`isActive: true`)

### WhatsApp messages not receiving
- Verify webhook URL is publicly accessible (use ngrok for dev)
- Check `WHATSAPP_VERIFY_TOKEN` matches Meta settings
- Check Meta webhook subscription for `messages` field

### AI scoring returns null
- Check `OPENAI_API_KEY` is valid
- Ensure customer has 3+ messages
- Check AI service logs for API errors

### Automation not executing
- Ensure Redis is running (`docker compose up -d redis`)
- Ensure worker is running (`npm run worker`)
- Check BullMQ queue for failed jobs via Prisma Studio

### Build fails with type errors
- Run `npm run db:generate` to regenerate Prisma client
- Check for Zod 4 compatibility (use `z.record(z.string(), z.unknown())`)

---

## Contact

- **Repo**: https://github.com/pacpltradingdesk-dotcom/indicator-crm
- **Author**: indicator-pine_R_CRM
- **Email**: pacpl.tradingdesk@gmail.com
