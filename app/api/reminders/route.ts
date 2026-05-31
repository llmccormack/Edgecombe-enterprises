import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendReminder } from '@/lib/twilio'
import { Invoice } from '@/types'

export async function POST(req: NextRequest) {
  const db = createServerClient()
  const { invoiceId, type } = await req.json()

  const { data, error } = await db
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const invoice = data as Invoice
  if (invoice.status === 'paid') {
    return NextResponse.json({ error: 'Invoice is already paid — no reminder sent' }, { status: 400 })
  }

  const result = await sendReminder(invoice, type)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  await db
    .from('invoices')
    .update({
      last_reminder_sent_at: new Date().toISOString(),
      reminder_count: invoice.reminder_count + 1,
    })
    .eq('id', invoiceId)

  return NextResponse.json({ success: true, sid: result.sid })
}
