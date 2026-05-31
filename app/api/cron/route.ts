import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendReminder } from '@/lib/twilio'
import { markOverdueInvoices, getInvoicesDueForReminder, getReminderType } from '@/lib/invoices'

// Protect the cron endpoint with a secret header
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // dev mode
  return req.headers.get('x-cron-secret') === secret
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServerClient()
  const results: { invoiceNumber: string; action: string; success: boolean; error?: string }[] = []

  // Step 1: Mark any past-due pending invoices as overdue
  const overdueCount = await markOverdueInvoices()
  results.push({ invoiceNumber: 'SYSTEM', action: `Marked ${overdueCount} invoices as overdue`, success: true })

  // Step 2: Find invoices that need reminders
  const invoices = await getInvoicesDueForReminder()

  for (const invoice of invoices) {
    const type = getReminderType(invoice)
    const result = await sendReminder(invoice, type)

    if (result.success) {
      await db.from('invoices').update({
        last_reminder_sent_at: new Date().toISOString(),
        reminder_count: invoice.reminder_count + 1,
      }).eq('id', invoice.id)
    }

    results.push({
      invoiceNumber: invoice.invoice_number,
      action: `Sent ${type} reminder`,
      success: result.success,
      error: result.error,
    })
  }

  return NextResponse.json({ processed: results.length, results })
}

// Also allow GET for easy testing
export async function GET(req: NextRequest) {
  return POST(req)
}
