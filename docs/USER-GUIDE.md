# Indicator CRM - User Guide & Demo Book

> A step-by-step walkthrough for new users to get started with Indicator CRM.

---

## Table of Contents

1. [First Login](#1-first-login)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Managing Customers](#3-managing-customers)
4. [WhatsApp Chat](#4-whatsapp-chat)
5. [Lead Scoring & Kanban Board](#5-lead-scoring--kanban-board)
6. [Payments](#6-payments)
7. [Automation Workflows](#7-automation-workflows)
8. [Products & Tags](#8-products--tags)
9. [Message Templates](#9-message-templates)
10. [Settings & Configuration](#10-settings--configuration)
11. [Dark Mode](#11-dark-mode)
12. [Mobile Usage](#12-mobile-usage)
13. [Tips & Best Practices](#13-tips--best-practices)

---

## 1. First Login

### Opening the App

1. Open your browser and navigate to `http://localhost:3000` (development) or your production URL
2. You will be redirected to the **Login Page**

### Login Page Layout

```
┌──────────────────────────────────────┐
│                                      │
│          Indicator CRM               │
│                                      │
│   ┌──────────────────────────────┐   │
│   │  Email                       │   │
│   │  admin@indicatorcrm.com      │   │
│   └──────────────────────────────┘   │
│   ┌──────────────────────────────┐   │
│   │  Password                    │   │
│   │  ••••••••                    │   │
│   └──────────────────────────────┘   │
│                                      │
│   [ Sign In ]                        │
│                                      │
└──────────────────────────────────────┘
```

### Default Credentials

| Field | Value |
|-------|-------|
| Email | `admin@indicatorcrm.com` |
| Password | `admin123` |

> **Important**: Change your password after first login via Settings.

### User Roles

- **Admin**: Full access to all features including Settings
- **Agent**: Can manage customers, chat, and view leads, but cannot access Settings

---

## 2. Dashboard Overview

After login, you land on the **Dashboard** - your command center for the entire CRM.

### Dashboard Layout

```
┌────────┬───────────────────────────────────────────────┐
│        │                                               │
│  S     │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  I     │  │Total │ │ Hot  │ │Conv- │ │Total │       │
│  D     │  │Cust. │ │Leads │ │erted │ │Rev.  │       │
│  E     │  │  47  │ │  12  │ │   8  │ │₹2.4L │       │
│  B     │  └──────┘ └──────┘ └──────┘ └──────┘       │
│  A     │                                               │
│  R     │  ┌─────────────────┐ ┌─────────────────┐     │
│        │  │  Lead Funnel    │ │ Source Dist.     │     │
│  ───   │  │  ████████ NEW   │ │ ██ WhatsApp 45% │     │
│  📊    │  │  ██████ ENG.    │ │ ██ Website  30% │     │
│  💬    │  │  ████ INT.      │ │ ██ Referral 15% │     │
│  👥    │  │  ██ NEG.        │ │ ██ Manual   10% │     │
│  📈    │  │  █ CONV.        │ │                  │     │
│  💰    │  └─────────────────┘ └─────────────────┘     │
│  ⚡    │                                               │
│  ⚙️    │  ┌─────────────────────────────────────┐     │
│        │  │  Recent Activity                     │     │
│        │  │  • Rahul sent a message (2m ago)     │     │
│        │  │  • New lead: +91 98765... (5m ago)   │     │
│        │  │  • Payment ₹4,999 received (1h ago)  │     │
│        │  └─────────────────────────────────────┘     │
└────────┴───────────────────────────────────────────────┘
```

### Key Metrics Explained

| Card | What It Shows |
|------|--------------|
| **Total Customers** | All leads + converted customers in the system |
| **Hot Leads** | Customers with temperature = HOT (high buying intent) |
| **Converted** | Customers who moved to CONVERTED stage |
| **Total Revenue** | Sum of all captured payments |

### Charts

- **Lead Funnel**: Bar chart showing how many customers are at each stage (NEW → ENGAGED → INTERESTED → NEGOTIATION → CONVERTED)
- **Source Distribution**: Pie chart showing where your leads come from (WhatsApp, Website, Referral, Manual, etc.)
- **Recent Activity**: Live feed of latest actions (messages, new leads, payments, stage changes)

### Real-time Updates

The dashboard updates in real-time via SSE (Server-Sent Events). When a new WhatsApp message arrives or a payment is received, the stats refresh automatically without page reload.

---

## 3. Managing Customers

Navigate to **Customers** from the sidebar.

### Customer List View

```
┌─────────────────────────────────────────────────────────┐
│  Customers                              [+ Add Customer]│
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔍 Search by name, phone, or email...           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Filters: [Stage ▾] [Temperature ▾] [Source ▾] [Tag ▾] │
│                                                         │
│  ☐ │ Name          │ Phone        │ Stage  │ Temp │ Scr│
│  ──┼───────────────┼──────────────┼────────┼──────┼────│
│  ☐ │ Rahul Sharma  │ +91 98765... │ INTER. │ 🔥HOT│ 85 │
│  ☐ │ Priya Patel   │ +91 87654... │ NEW    │ 🟡WRM│ 52 │
│  ☐ │ Amit Kumar    │ +91 76543... │ ENGAG. │ 🔥HOT│ 78 │
│  ☐ │ Sneha Reddy   │ +91 65432... │ NEW    │ ❄️CLD│ 23 │
│  ☐ │ Vikram Singh  │ +91 54321... │ CONV.  │ 🔥HOT│ 92 │
│                                                         │
│  ◀ Page 1 of 5 ▶                     Showing 10/47     │
└─────────────────────────────────────────────────────────┘
```

### Adding a New Customer

1. Click **+ Add Customer** button (top right)
2. Fill in the form:
   - **Phone** (required): Customer's WhatsApp number with country code (e.g., +919876543210)
   - **Name**: Customer's name
   - **Email**: Optional email address
   - **Source**: Where this lead came from (WhatsApp / Website / Referral / Manual / Other)
   - **Stage**: Initial lead stage (defaults to NEW)
   - **Temperature**: Initial temperature (defaults to COLD)
   - **Notes**: Any initial notes
3. Click **Save**

### Viewing Customer Details

Click on any customer row to open their detail page:

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Customers                                    │
│                                                         │
│  Rahul Sharma                          Lead Score: 85/100│
│  +91 9876543210 | rahul@email.com                       │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │Stage:    │ │Temp:     │ │Source:   │               │
│  │INTERESTED│ │🔥 HOT    │ │WhatsApp  │               │
│  └──────────┘ └──────────┘ └──────────┘               │
│                                                         │
│  Tags: [interested_in_nifty] [wants_demo] [experienced] │
│                                                         │
│  AI Summary:                                            │
│  "Experienced trader interested in Nifty scalping       │
│   indicators. Has been trading for 3+ years. Asking     │
│   about backtesting results and pricing."               │
│                                                         │
│  ┌─ Notes ──────────────────────────────────────────┐  │
│  │ Spoke on call, wants demo next week               │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Payment History ────────────────────────────────┐  │
│  │ ₹4,999 | Nifty Scalper Pro | CAPTURED | 12 Jan   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Activity Timeline ──────────────────────────────┐  │
│  │ • Stage changed to INTERESTED (2 days ago)        │  │
│  │ • AI score updated: 85 (3 days ago)               │  │
│  │ • Message sent (3 days ago)                       │  │
│  │ • Customer created (1 week ago)                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Editing a Customer

On the customer detail page:
- Click on any field (Stage, Temperature, Source) to change it via dropdown
- Edit name, email, notes inline
- Add/remove tags
- All changes auto-save via API

### Bulk Operations

1. Select multiple customers using the checkboxes (☐) in the customer list
2. A **Bulk Actions** bar appears at the top:

```
┌─────────────────────────────────────────────────────────┐
│  ✓ 5 selected    [Action ▾] [Value ▾] [Apply] [Cancel] │
└─────────────────────────────────────────────────────────┘
```

Available bulk actions:
- **Change Stage**: Move all selected to a specific stage
- **Change Temperature**: Set temperature for all selected
- **Add Tag**: Apply a tag to all selected customers
- **Remove Tag**: Remove a tag from all selected
- **Delete**: Permanently delete selected customers (with confirmation)

### CSV Export

Click the **Export** button to download all filtered customers as a CSV file.

---

## 4. WhatsApp Chat

Navigate to **Chat** from the sidebar.

### Chat Interface Layout

```
┌────────────┬──────────────────────────────┬──────────────┐
│ Contacts   │       Rahul Sharma           │ Contact Info │
│            │       +91 9876543210         │              │
│ 🔍 Search  │──────────────────────────────│ Stage: INT.  │
│            │                              │ Temp: HOT    │
│ ● Rahul S  │  [Customer] 10:30 AM        │ Score: 85    │
│   "Thanks" │  Hi, I saw your indicator    │              │
│ ● Priya P  │  on TradingView. Can you    │ Tags:        │
│   "Price?" │  tell me more?              │ [nifty]      │
│ ● Amit K   │                              │ [demo]       │
│   "Demo?"  │        [You] 10:35 AM        │              │
│ ● Sneha R  │  Hi Rahul! Thanks for your  │ Payments:    │
│   "Hello"  │  interest. Our Nifty Scalp- │ ₹4,999       │
│            │  er Pro gives 80%+ accuracy │              │
│            │  on Nifty trades.            │ Notes:       │
│            │                              │ Wants demo   │
│            │  [Customer] 10:40 AM        │ next week    │
│            │  What's the price?           │              │
│            │                              │              │
│            │──────────────────────────────│              │
│            │ Type a message...    [Send]  │              │
└────────────┴──────────────────────────────┴──────────────┘
```

### Three Panels

1. **Left Panel - Contact List**: All customers sorted by last message time. Shows unread indicator and last message preview
2. **Center Panel - Chat**: Message thread with the selected customer. Your messages appear on the right (blue), customer messages on the left (gray)
3. **Right Panel - Contact Info**: Quick view of customer details, tags, payments, and notes

### Sending Messages

**Text Message**:
1. Select a customer from the left panel
2. Type your message in the input box at the bottom
3. Press Enter or click **Send**
4. Message is sent via WhatsApp Business API
5. Status updates: Sent → Delivered → Read (with checkmarks)

**Template Message**:
1. Click the **Template** icon next to the input box
2. Select an approved WhatsApp template
3. Fill in template variables (if any)
4. Click **Send Template**

> **Note**: WhatsApp has a 24-hour messaging window. If a customer hasn't messaged you in 24 hours, you can only send template messages.

### Message Status Indicators

| Icon | Status |
|------|--------|
| 🕐 | Sending |
| ✓ | Sent |
| ✓✓ | Delivered |
| ✓✓ (blue) | Read |

### Receiving Messages

When a customer sends a WhatsApp message:
1. The message appears instantly in the chat (real-time via SSE)
2. The contact moves to the top of the list
3. A notification sound plays
4. If this is a new number, a new Customer record is created automatically

---

## 5. Lead Scoring & Kanban Board

Navigate to **Leads** from the sidebar.

### Kanban Board

Leads are displayed as cards organized in columns by stage:

```
┌────────────┬────────────┬────────────┬────────────┬────────────┬────────────┐
│    NEW     │  ENGAGED   │ INTERESTED │NEGOTIATION │ CONVERTED  │  CHURNED   │
│    (12)    │    (8)     │    (5)     │    (3)     │    (8)     │    (2)     │
├────────────┼────────────┼────────────┼────────────┼────────────┼────────────┤
│┌──────────┐│┌──────────┐│┌──────────┐│┌──────────┐│┌──────────┐│┌──────────┐│
││Sneha R.  │││Amit K.   │││Rahul S.  │││Deepak M. │││Vikram S. │││Lost Lead ││
││❄️ COLD 23│││🔥 HOT  78│││🔥 HOT  85│││🟡 WARM 61│││🔥 HOT  92│││💀 DEAD 15││
││WhatsApp  │││Website   │││WhatsApp  │││Referral  │││WhatsApp  │││WhatsApp  ││
│└──────────┘│└──────────┘│└──────────┘│└──────────┘│└──────────┘│└──────────┘│
│┌──────────┐│┌──────────┐│┌──────────┐│            │┌──────────┐│            │
││New Lead  │││Priya P.  │││Kiran J.  ││            ││Meera D.  ││            │
││❄️ COLD 10│││🟡 WARM 52│││🟡 WARM 58││            ││🔥 HOT  88││            │
││Manual    │││WhatsApp  │││Website   ││            ││Referral  ││            │
│└──────────┘│└──────────┘│└──────────┘│            │└──────────┘│            │
│    ...     │    ...     │            │            │    ...     │            │
└────────────┴────────────┴────────────┴────────────┴────────────┴────────────┘
```

### Drag and Drop

- **Drag** any lead card from one column to another to change their stage
- The stage updates instantly (optimistic update) and syncs with the backend
- If the API call fails, the card snaps back to its original column

### Lead Cards

Each card shows:
- **Customer name**
- **Temperature indicator**: 🔥 HOT / 🟡 WARM / ❄️ COLD / 💀 DEAD
- **Lead score**: 0-100 (AI-generated)
- **Source**: Where the lead came from

Click a card to navigate to the customer's detail page.

### AI Lead Scoring

The AI automatically scores customers after every 3 messages. You can also trigger it manually:

1. Go to a customer's detail page
2. Click **Analyze with AI** button
3. The AI analyzes the last 20 messages and returns:
   - **Score** (0-100): Overall buying likelihood
   - **Temperature**: HOT (70+), WARM (40-69), COLD (<40)
   - **Summary**: Natural language description of the lead
   - **Tags**: Auto-generated tags like `interested_in_nifty`, `price_sensitive`, `wants_demo`
   - **Interests**: Detected product interests

### Score Interpretation

| Score Range | Temperature | Meaning |
|-------------|------------|---------|
| 70-100 | 🔥 HOT | High intent, ready to buy. Prioritize these leads |
| 40-69 | 🟡 WARM | Shows interest but needs nurturing |
| 1-39 | ❄️ COLD | Low engagement, might need time |
| 0 | 💀 DEAD | Unresponsive or explicitly not interested |

---

## 6. Payments

Navigate to **Payments** from the sidebar.

### Payment List

```
┌─────────────────────────────────────────────────────────┐
│  Payments                                               │
│                                                         │
│  Customer       │ Amount    │ Product         │ Status  │
│  ───────────────┼───────────┼─────────────────┼─────────│
│  Vikram Singh   │ ₹4,999   │ Nifty Scalper   │ ✅ CAPTURED│
│  Meera Das      │ ₹7,999   │ BankNifty Master│ ✅ CAPTURED│
│  Rahul Sharma   │ ₹4,999   │ Nifty Scalper   │ ✅ CAPTURED│
│  Amit Kumar     │ ₹2,999   │ Sensex Swing    │ 🕐 CREATED│
│                                                         │
│  Total Revenue: ₹20,996                                 │
└─────────────────────────────────────────────────────────┘
```

### Payment Statuses

| Status | Meaning |
|--------|---------|
| **CREATED** | Payment link generated, awaiting payment |
| **AUTHORIZED** | Payment authorized, pending capture |
| **CAPTURED** | Payment successful and captured |

### How Payments Work

1. **Create a payment link** via Razorpay dashboard or API
2. **Share the link** with the customer via WhatsApp chat
3. Customer completes payment on Razorpay
4. **Webhook fires** automatically:
   - Payment record created in CRM
   - Customer's `totalSpent` updated
   - Activity logged
   - Automation trigger `PAYMENT_RECEIVED` fires (if configured)

---

## 7. Automation Workflows

Navigate to **Automations** from the sidebar.

### Automation List

```
┌─────────────────────────────────────────────────────────┐
│  Automations                          [+ New Automation]│
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🟢 New Lead Welcome Flow                        │   │
│  │ Trigger: Customer Created                        │   │
│  │ Steps: 4 | Runs: 23 | Last: 2h ago              │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🟢 Payment Confirmation                         │   │
│  │ Trigger: Payment Received                        │   │
│  │ Steps: 3 | Runs: 8 | Last: 1d ago               │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔴 Follow-up Sequence (Inactive)                │   │
│  │ Trigger: Manual                                  │   │
│  │ Steps: 6 | Runs: 0                               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Creating a Workflow

1. Click **+ New Automation**
2. Set workflow details:
   - **Name**: Descriptive name (e.g., "New Lead Welcome Flow")
   - **Trigger**: What starts the workflow
   - **Active**: Toggle on/off

### Available Triggers

| Trigger | When It Fires |
|---------|--------------|
| **Customer Created** | New customer added (manual or via WhatsApp) |
| **Message Received** | Customer sends a WhatsApp message |
| **Payment Received** | Razorpay webhook confirms payment |
| **Manual** | Triggered manually from customer detail page |

### Adding Steps

Build your workflow by adding steps in order:

```
┌─────────────────────────────────────────────────────────┐
│  New Lead Welcome Flow                                  │
│                                                         │
│  Trigger: Customer Created                              │
│                                                         │
│  Step 1: SEND_TEXT                                      │
│  ┌──────────────────────────────────────────┐          │
│  │ Message: "Hi {{name}}! Thanks for your   │          │
│  │ interest in our trading indicators. 📊"   │          │
│  └──────────────────────────────────────────┘          │
│           │                                             │
│           ▼                                             │
│  Step 2: WAIT                                           │
│  ┌──────────────────────────────────────────┐          │
│  │ Duration: 1 hour                          │          │
│  └──────────────────────────────────────────┘          │
│           │                                             │
│           ▼                                             │
│  Step 3: SEND_TEXT                                      │
│  ┌──────────────────────────────────────────┐          │
│  │ Message: "Would you like to see a demo    │          │
│  │ of our Nifty Scalper Pro indicator?"      │          │
│  └──────────────────────────────────────────┘          │
│           │                                             │
│           ▼                                             │
│  Step 4: ADD_TAG                                        │
│  ┌──────────────────────────────────────────┐          │
│  │ Tag: "welcome_sent"                       │          │
│  └──────────────────────────────────────────┘          │
│                                                         │
│  [+ Add Step]                           [Save Workflow] │
└─────────────────────────────────────────────────────────┘
```

### Step Types Reference

| Step | What It Does | Config |
|------|-------------|--------|
| **Send Text** | Sends a WhatsApp text message | Message text (supports `{{name}}` variable) |
| **Send Template** | Sends an approved WhatsApp template | Template name + parameters |
| **Wait** | Pauses the workflow | Duration (minutes/hours/days) |
| **Wait for Reply** | Pauses until customer replies | Timeout duration |
| **Add Tag** | Applies a tag to the customer | Tag name |
| **Change Stage** | Moves customer to a stage | Target stage |
| **AI Analyze** | Runs AI scoring | No config needed |
| **Notify Admin** | Creates an admin alert | Notification message |
| **Schedule Call** | Sets a follow-up reminder | Message + delay |
| **Conditional Branch** | If/then logic | Field, operator, value |

### Example: Payment Confirmation Workflow

```
Trigger: Payment Received
  → Step 1: SEND_TEXT "Thank you for your purchase, {{name}}! 🎉"
  → Step 2: CHANGE_STAGE to "CONVERTED"
  → Step 3: ADD_TAG "paying_customer"
  → Step 4: NOTIFY_ADMIN "New payment from {{name}}"
```

### Monitoring Workflow Runs

Each workflow shows execution history:
- **RUNNING**: Currently executing
- **WAITING**: Paused (waiting for reply or delay)
- **COMPLETED**: Successfully finished all steps
- **FAILED**: An error occurred (check logs)

---

## 8. Products & Tags

### Products

Manage your indicator product catalog via **Settings > Products** or the API.

**Seed products included**:

| Product | Price |
|---------|-------|
| Nifty Scalper Pro | ₹4,999 |
| BankNifty Options Master | ₹7,999 |
| Sensex Swing Trader | ₹2,999 |
| Complete Trading Bundle | ₹14,999 |
| Options Strategy Scanner | ₹3,499 |

Each product has:
- Name, description, price, currency
- Category (e.g., "Scalping", "Swing", "Options")
- Features list
- Active/inactive toggle

### Tags

Tags help categorize customers. They can be:
- **Manually applied**: By agents in the customer detail page
- **AI-generated**: Automatically applied during AI scoring

**Default tags**:
- `interested_in_nifty`, `interested_in_banknifty`, `interested_in_options`
- `price_sensitive`, `wants_demo`, `experienced_trader`
- `beginner`, `high_value`

Create custom tags with:
- **Name**: Short, descriptive (e.g., "vip_client")
- **Color**: Hex color code for visual distinction (e.g., `#FF6B6B`)

---

## 9. Message Templates

WhatsApp Business requires pre-approved templates for messages sent outside the 24-hour window.

### Managing Templates

Navigate to **Settings > Templates** or use the sidebar.

```
┌─────────────────────────────────────────────────────────┐
│  Message Templates                     [+ New Template] │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ welcome_message                                  │   │
│  │ Category: MARKETING | Language: en               │   │
│  │                                                   │   │
│  │ "Hello {{1}}! Welcome to our trading community.  │   │
│  │  Check out our latest indicators at {{2}}"       │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ payment_reminder                                 │   │
│  │ Category: UTILITY | Language: en                 │   │
│  │                                                   │   │
│  │ "Hi {{1}}, your payment of ₹{{2}} is pending.   │   │
│  │  Complete it here: {{3}}"                        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Template Variables

Use `{{1}}`, `{{2}}`, etc. as placeholders. When sending, provide the actual values:
- `{{1}}` → Customer name
- `{{2}}` → Product name or URL
- `{{3}}` → Payment link

### Template Categories

| Category | Use Case |
|----------|---------|
| **MARKETING** | Promotions, offers, announcements |
| **UTILITY** | Order updates, payment reminders |
| **AUTHENTICATION** | OTPs, verification codes |

> **Note**: Templates must be approved by Meta before use. Create them in your Meta Business Manager first, then register them in the CRM.

---

## 10. Settings & Configuration

Navigate to **Settings** from the sidebar. **Admin access required.**

### Settings Sections

#### WhatsApp Configuration
| Setting | Description |
|---------|------------|
| Access Token | WhatsApp Business API token from Meta Developer Portal |
| Phone Number ID | Your registered WhatsApp Business phone number ID |
| Business Account ID | Your WhatsApp Business Account ID |
| Verify Token | Token for webhook verification |

#### Razorpay Configuration
| Setting | Description |
|---------|------------|
| Key ID | Razorpay API key (starts with `rzp_`) |
| Key Secret | Razorpay API secret |
| Webhook Secret | Secret for verifying Razorpay webhook signatures |

#### OpenAI Configuration
| Setting | Description |
|---------|------------|
| API Key | OpenAI API key for AI scoring (starts with `sk-`) |

#### Business Information
| Setting | Description |
|---------|------------|
| Business Name | Your company name |
| Business Phone | Your business phone number |
| Business Email | Your business email |

#### Feature Toggles
| Setting | Description |
|---------|------------|
| Auto Reply Enabled | Enable/disable automatic WhatsApp replies |
| AI Scoring Enabled | Enable/disable automatic AI lead scoring |

---

## 11. Dark Mode

Indicator CRM supports **dark mode** with automatic system preference detection.

### Toggling Dark Mode

1. Look at the bottom of the sidebar
2. Click the **Moon icon** (🌙) to switch to dark mode
3. Click the **Sun icon** (☀️) to switch back to light mode
4. The app remembers your preference

### Modes

| Mode | Description |
|------|------------|
| **Light** | Default bright theme with white backgrounds |
| **Dark** | Dark theme with reduced eye strain for night use |
| **System** | Automatically matches your OS preference (default) |

---

## 12. Mobile Usage

Indicator CRM is fully responsive and works on mobile devices.

### Mobile Navigation

```
┌──────────────────────────┐
│ ☰  Indicator CRM         │
├──────────────────────────┤
│                          │
│  Dashboard content       │
│  adapts to screen        │
│  width                   │
│                          │
│  Cards stack vertically  │
│  Tables become scrollable│
│  Sidebar becomes overlay │
│                          │
└──────────────────────────┘
```

- **Hamburger menu** (☰): Tap to open the sidebar navigation
- **Sidebar overlay**: Slides in from the left, tap outside to close
- **Tables**: Horizontally scrollable, less important columns hidden
- **Chat**: Contact list and chat are separate views on mobile
- **Kanban**: Columns are horizontally scrollable

### Mobile-Specific Behavior

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Sidebar | Always visible | Toggle with ☰ |
| Chat panels | 3-column layout | Single panel with navigation |
| Customer table | All columns visible | Key columns only (name, phone, stage) |
| Kanban board | All columns visible | Horizontally scrollable |
| Dashboard cards | 4 across | 2 across, stacked |

---

## 13. Tips & Best Practices

### Lead Management
- **Respond quickly**: WhatsApp leads have highest conversion when replied within 5 minutes
- **Use AI scoring**: Let the AI prioritize your leads. Focus on HOT leads first
- **Tag everything**: Tags help segment customers for targeted campaigns
- **Use automations**: Set up welcome flows so no lead goes unattended

### WhatsApp Best Practices
- **24-hour window**: You can only send free-form messages within 24 hours of the customer's last message. After that, use templates
- **Don't spam**: WhatsApp monitors message quality. Keep your quality rating high
- **Use templates wisely**: Pre-approve templates for common scenarios (welcome, payment reminder, offer)
- **Personalize**: Use `{{name}}` variables in automations for a personal touch

### Automation Tips
- **Start simple**: Begin with a 2-3 step welcome flow
- **Use waits**: Don't send multiple messages instantly. Space them out with WAIT steps
- **Add conditions**: Use CONDITIONAL_BRANCH to handle different customer segments
- **Monitor runs**: Check workflow run logs regularly for failures

### Sales Pipeline
- **NEW**: Just entered the system. Send welcome message
- **ENGAGED**: Responding to messages. Build rapport
- **INTERESTED**: Asking about products. Share demos and pricing
- **NEGOTIATION**: Discussing pricing. Create urgency, offer bundles
- **CONVERTED**: Payment received. Onboard and support
- **CHURNED**: Lost interest. Can be re-engaged later via campaigns

### Performance Tips
- **Use filters**: Don't scroll through all customers. Use stage/temperature/tag filters
- **Bulk operations**: Select multiple customers for mass actions instead of one-by-one
- **Keyboard shortcuts**: Press Enter to send messages in chat
- **Export data**: Use CSV export for offline analysis or reporting

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│              INDICATOR CRM - QUICK REFERENCE             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  STAGES:    NEW → ENGAGED → INTERESTED →                │
│             NEGOTIATION → CONVERTED (or CHURNED)        │
│                                                         │
│  TEMP:      🔥 HOT (70+) │ 🟡 WARM (40-69)            │
│             ❄️ COLD (<40)  │ 💀 DEAD (0)                │
│                                                         │
│  AI SCORE:  Triggered every 3 messages or manually      │
│             Uses last 20 messages for analysis           │
│                                                         │
│  TRIGGERS:  Customer Created │ Message Received          │
│             Payment Received │ Manual                    │
│                                                         │
│  RATE LIMITS: API: 100/min │ Messages: 30/min           │
│               AI: 10/min  │ Auth: 10/15min              │
│                                                         │
│  DEFAULT LOGIN: admin@indicatorcrm.com / admin123       │
│                                                         │
│  KEY URLS:  Dashboard  → /dashboard                     │
│             Customers  → /customers                     │
│             Chat       → /chat                          │
│             Leads      → /leads                         │
│             Payments   → /payments                      │
│             Automations→ /automations                   │
│             Settings   → /settings                      │
│             Health     → /api/health                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

*This guide was created for Indicator CRM v1.0. For developer documentation, see [HANDOVER.md](./HANDOVER.md).*
