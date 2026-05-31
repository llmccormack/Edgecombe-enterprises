# Edgecombe Enterprises — Invoice Manager

Client invoice management for Edgecombe Enterprises landscaping & hardscaping.

**Features:**
- Create branded invoices with auto-sequential numbers (EE-001, EE-002…)
- 20 pre-loaded landscaping/hardscaping services with editable line items
- Automatic subtotal, tax, and total calculation
- Downloadable branded PDF invoices
- Payment tracking — Pending / Overdue / Paid
- Dashboard with outstanding, overdue, paid-this-month totals
- Automated WhatsApp/SMS reminders via Twilio (creation, 3-day, due-day, weekly overdue)
- Daily cron job via `node-cron`

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is fine)
- A [Twilio](https://twilio.com) account for messaging (optional — app works without it)

---

## 1 — Clone & Install

```bash
git clone <repo-url> edgecombe-invoices
cd edgecombe-invoices
npm install
```

---

## 2 — Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com).
2. In the SQL Editor, paste and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

> The `service_role` key bypasses Row Level Security and is only used server-side. Keep it secret.

---

## 3 — Twilio Setup (optional)

### SMS
1. Sign up at [twilio.com](https://twilio.com).
2. Buy a phone number with SMS capability.
3. Copy your **Account SID** and **Auth Token** from the Console Dashboard.
4. Set `TWILIO_SMS_NUMBER` to your Twilio number (e.g. `+19195550100`).

### WhatsApp (preferred — richer messages)
1. In the Twilio Console, go to **Messaging → Try it out → Send a WhatsApp message**.
2. Use the sandbox number (`+14155238886`) during development.
3. For production, apply for a WhatsApp sender through Twilio's approval process.
4. Set `TWILIO_WHATSAPP_NUMBER` to the WhatsApp-enabled number.

The app tries WhatsApp first and falls back to SMS automatically.

---

## 4 — Environment Variables

```bash
cp .env.example .env.local
```

Fill in all values from the steps above. At minimum you need the three Supabase keys. Twilio keys are optional — reminders simply won't send if they're missing.

---

## 5 — Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The custom `server.js` starts Next.js **and** schedules the daily 9 AM ET cron job in the same process.

---

## 6 — Production Deployment

### Vercel (recommended)
1. `vercel --prod`
2. Set all env vars in the Vercel dashboard under **Settings → Environment Variables**.
3. Add a [Vercel Cron Job](https://vercel.com/docs/cron-jobs) that hits `POST /api/cron` daily:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 14 * * *"
    }
  ]
}
```
> `0 14 * * *` = 9 AM ET (UTC-5). Adjust for daylight saving as needed.

Set `CRON_SECRET` and pass it as the `x-cron-secret` header in your cron config.

### Self-hosted (VPS / Docker)
```bash
npm run build
npm start
```
The `server.js` cron fires automatically. Use `pm2` or `systemd` to keep the process alive.

---

## Directory Structure

```
edgecombe-invoices/
├── app/
│   ├── page.tsx                  # Dashboard
│   ├── invoices/
│   │   ├── page.tsx              # Invoice list
│   │   ├── new/page.tsx          # Create invoice
│   │   └── [id]/page.tsx         # Invoice detail
│   ├── settings/page.tsx
│   └── api/
│       ├── invoices/route.ts     # GET list, POST create
│       ├── invoices/[id]/route.ts # GET, PATCH, DELETE
│       ├── reminders/route.ts    # Manual reminder trigger
│       ├── cron/route.ts         # Daily automated check
│       ├── pdf/[id]/route.ts     # PDF download
│       └── settings/route.ts    # GET/POST settings
├── components/                   # Shared React components
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── twilio.ts                 # Twilio messaging
│   ├── pdf.ts                    # jsPDF invoice generator
│   └── invoices.ts               # Business logic helpers
├── types/index.ts                # TypeScript types + service list
├── supabase/schema.sql           # Database schema
├── server.js                     # Custom server with cron
└── .env.example
```

---

## Reminder Schedule

| Trigger | Message type |
|---|---|
| Invoice created | `created` — "Your invoice has been created…" |
| 3 days before due | `reminder_3day` — "Friendly reminder, due in 3 days…" |
| On due date | `due_today` — "Your invoice is due today…" |
| Each 7 days overdue | `overdue` — "Your invoice is past due…" |

Reminders stop automatically once an invoice is marked **Paid**.
