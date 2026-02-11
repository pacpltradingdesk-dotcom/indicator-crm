# Indicator CRM

A full-stack CRM system built for **trading indicator sellers** - specifically designed for managing leads, WhatsApp conversations, payments, and automated workflows for TradingView Pine Script indicator businesses targeting Indian markets (Nifty, BankNifty, Sensex, etc.).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, Radix UI, Lucide Icons |
| **State** | Zustand, React Hot Toast |
| **Charts** | Recharts |
| **Drag & Drop** | @dnd-kit |
| **Backend** | Next.js API Routes (serverless) |
| **Database** | Prisma ORM + SQLite (switchable to PostgreSQL) |
| **Auth** | NextAuth.js (JWT + Credentials) |
| **Queue** | BullMQ + Redis |
| **AI** | OpenAI GPT-4o-mini |
| **Payments** | Razorpay |
| **Messaging** | WhatsApp Business Cloud API |
| **Real-time** | Server-Sent Events (SSE) |

---

## Features

### Lead Management
- Phone-based customer identification
- Lead scoring (0-100) with AI analysis
- Temperature classification: HOT / WARM / COLD / DEAD
- Stage tracking: NEW > ENGAGED > INTERESTED > NEGOTIATION > CONVERTED / CHURNED
- Manual + AI-generated tags
- Drag-and-drop Kanban board

### WhatsApp Integration
- Two-way messaging via WhatsApp Business Cloud API
- Text and template message sending
- Real-time message delivery status (Sent > Delivered > Read)
- Auto-reply via automation workflows

### Payment Processing
- Razorpay integration for order creation
- Payment webhook for automatic confirmation
- Customer payment history tracking
- Product catalog management

### Automation Engine
- Visual workflow builder with 10 step types
- Triggers: Customer Created, Message Received, Payment Received, Manual
- Steps: Send Text, Send Template, Wait, Wait for Reply, Add Tag, Change Stage, AI Analyze, Notify Admin, Schedule Call, Conditional Branch
- Execution logging with step-by-step status

### AI-Powered Scoring
- GPT-4o-mini analyzes customer conversations
- Automatic scoring every 3 messages
- Detects trading experience, product interest, preferred markets
- Auto-tags customers with confidence scores
- Generates customer summaries

### Dashboard & Analytics
- Total customers, hot leads, conversions
- Revenue tracking (total + monthly)
- Lead funnel visualization
- Source distribution chart
- Recent activity feed
- Real-time updates via SSE

### Bulk Operations
- Select multiple customers
- Bulk change stage / temperature
- Bulk add / remove tags
- Bulk delete

### UI/UX
- Dark mode with system preference detection
- Mobile responsive with collapsible sidebar
- Skeleton loading states
- Error boundaries with retry
- CSV export

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **Redis** (for background workers) - optional for basic usage

### 1. Clone & Install

```bash
git clone https://github.com/pacpltradingdesk-dotcom/indicator-crm.git
cd indicator-crm
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Required
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN="your-whatsapp-token"
WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
WHATSAPP_BUSINESS_ACCOUNT_ID="your-business-account-id"
WHATSAPP_VERIFY_TOKEN="indicator-crm-verify-token"

# Razorpay
RAZORPAY_KEY_ID="rzp_test_xxx"
RAZORPAY_KEY_SECRET="your-secret"
RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"

# OpenAI (for AI scoring)
OPENAI_API_KEY="sk-xxx"

# Redis (for background workers)
REDIS_URL="redis://localhost:6379"
```

### 3. Database Setup

```bash
npm run db:push       # Create tables
npm run db:generate   # Generate Prisma client
npm run db:seed       # Seed with sample data
```

### 4. Start Development Server

```bash
npm run dev
```

Open **http://localhost:3000**

### 5. Login

```
Email:    admin@indicatorcrm.com
Password: admin123
```

### 6. (Optional) Start Background Workers

```bash
# Start Redis first
docker compose up -d redis

# Start workers
npm run worker
```

---

## Project Structure

```
indicator-crm/
├── prisma/
│   ├── schema.prisma          # Database schema (15 models)
│   └── seed.ts                # Sample data seeder
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Login page
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── customers/     # Customer list + detail
│   │   │   ├── chat/          # WhatsApp chat interface
│   │   │   ├── leads/         # Lead scoring + kanban
│   │   │   ├── payments/      # Payment history
│   │   │   ├── automations/   # Workflow builder
│   │   │   └── settings/      # System configuration
│   │   ├── api/               # 19 API route groups
│   │   ├── global-error.tsx   # Global error boundary
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── ui/                # 17 reusable UI components
│   │   ├── dashboard/         # Sidebar with dark mode toggle
│   │   └── providers.tsx      # Session + Theme providers
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── auth-guard.ts      # Route protection middleware
│   │   ├── rate-limit.ts      # In-memory rate limiter
│   │   ├── validations.ts     # Zod schemas for all endpoints
│   │   ├── whatsapp.ts        # WhatsApp API client
│   │   ├── razorpay.ts        # Razorpay helper
│   │   ├── prisma.ts          # Database client
│   │   ├── sse.ts             # Server-Sent Events manager
│   │   ├── constants.ts       # Business logic constants
│   │   └── utils.ts           # Helper functions
│   ├── services/
│   │   ├── ai-scoring.service.ts   # OpenAI lead analysis
│   │   └── analytics.service.ts    # Dashboard stats
│   ├── workers/
│   │   ├── automation.worker.ts    # Workflow executor
│   │   └── ai-analysis.worker.ts  # Background AI analysis
│   └── types/                 # TypeScript type definitions
├── docker-compose.yml         # Redis + PostgreSQL
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## API Reference

All API routes require authentication (except webhooks and health check).

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth login/logout |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List customers (paginated, filterable) |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/[id]` | Get customer detail |
| PATCH | `/api/customers/[id]` | Update customer |
| DELETE | `/api/customers/[id]` | Delete customer |
| POST | `/api/customers/bulk` | Bulk operations |

**Query Parameters for GET /api/customers:**
- `page`, `limit` - Pagination
- `search` - Search by name/phone/email
- `stage` - Filter by lead stage
- `temperature` - Filter by temperature
- `source` - Filter by source
- `tag` - Filter by tag name
- `sortBy`, `sortOrder` - Sorting
- `fields=minimal` - Lightweight response for chat

**Bulk Actions (POST /api/customers/bulk):**
```json
{
  "customerIds": ["id1", "id2"],
  "action": "CHANGE_STAGE | CHANGE_TEMPERATURE | ADD_TAG | REMOVE_TAG | DELETE",
  "value": "NEW"
}
```

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages?customerId=xxx` | Get message history |
| POST | `/api/messages` | Send WhatsApp message |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments` | List all payments |

### Automations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/automations` | List automations |
| POST | `/api/automations` | Create automation |
| GET | `/api/automations/[id]` | Get automation detail |
| PATCH | `/api/automations/[id]` | Update automation |
| DELETE | `/api/automations/[id]` | Delete automation |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Dashboard stats |
| POST | `/api/ai/analyze` | Trigger AI analysis |
| GET/POST | `/api/products` | Product catalog |
| GET/POST | `/api/tags` | Tag management |
| GET/POST | `/api/templates` | Message templates |
| GET/POST | `/api/settings` | System settings (admin only) |
| GET | `/api/sse?channel=chat` | Real-time SSE stream |
| GET | `/api/health` | Health check |

### Webhooks (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/webhooks/whatsapp` | WhatsApp message webhook |
| POST | `/api/webhooks/razorpay` | Payment confirmation |
| POST | `/api/webhooks/website` | Website form leads |

---

## Security

- **Authentication**: All API routes protected with `requireAuth()` / `requireAdmin()`
- **Validation**: Every POST/PATCH endpoint validates input with Zod schemas
- **Rate Limiting**: Per-IP rate limits (API: 100/min, Messages: 30/min, AI: 10/min, Auth: 10/15min)
- **Webhook Verification**: Razorpay signature verification, WhatsApp token verification
- **Password Hashing**: bcrypt with salt rounds
- **Settings Protection**: Admin-only access for API keys and configuration

---

## Database Models

| Model | Purpose |
|-------|---------|
| User | Agents and admins |
| Customer | Leads with scoring, stage, temperature |
| Tag / CustomerTag | Classification tags (manual + AI) |
| Message | WhatsApp message history |
| Payment | Razorpay payment records |
| Product | Trading indicator products |
| Automation / AutomationStep | Workflow definitions |
| WorkflowRun / WorkflowRunLog | Execution history |
| ScheduledFollowUp | Call/message reminders |
| MessageTemplate | WhatsApp templates |
| Activity | Audit trail |
| SystemSetting | Configuration store |

---

## Seed Data

Running `npm run db:seed` creates:

- **1 Admin user** (admin@indicatorcrm.com / admin123)
- **5 Products** (Nifty Scalper Pro, BankNifty Options Master, etc.)
- **8 Tags** (interested_in_nifty, price_sensitive, wants_demo, etc.)
- **5 Sample Customers** with messages, payments, and activities
- **2 Automations** (New Lead Welcome Flow, Payment Confirmation)

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Sync schema to database
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio GUI
npm run worker       # Start background workers
```

---

## Deployment

### Using Docker

```bash
docker compose up -d     # Start PostgreSQL + Redis
npm run build
npm run start
```

### Environment Variables for Production

- Set `DATABASE_URL` to your PostgreSQL connection string
- Set `NEXTAUTH_SECRET` to a strong random string
- Set `NEXTAUTH_URL` to your production URL
- Configure all API keys for WhatsApp, Razorpay, OpenAI

---

## License

ISC
