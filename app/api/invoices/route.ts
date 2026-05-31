import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendReminder } from '@/lib/twilio'
import { getNextInvoiceNumber } from '@/lib/invoices'

export async function GET() {
  const db = createServerClient()
  const { data, error } = await db
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  console.log('[POST /api/invoices] SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('[POST /api/invoices] SERVICE_KEY set:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

  const db = createServerClient()
  const body = await req.json()

  let invoiceNumber: string
  try {
    invoiceNumber = await getNextInvoiceNumber()
  } catch (err) {
    console.error('[POST /api/invoices] getNextInvoiceNumber failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  const { data, error } = await db
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      client_name: body.client_name,
      client_phone: body.client_phone,
      client_email: body.client_email ?? '',
      service_address: body.service_address ?? '',
      line_items: body.line_items,
      invoice_date: body.invoice_date,
      due_date: body.due_date,
      payment_terms: body.payment_terms ?? 'Net 30',
      notes: body.notes ?? '',
      subtotal: body.subtotal,
      tax_rate: body.tax_rate ?? 0,
      tax_amount: body.tax_amount ?? 0,
      total: body.total,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send creation notification (non-blocking — don't fail the request if Twilio is unconfigured)
  try {
    await sendReminder(data, 'created')
    await db.from('invoices').update({
      last_reminder_sent_at: new Date().toISOString(),
      reminder_count: 1,
    }).eq('id', data.id)
  } catch {
    // Twilio may not be configured yet — continue
  }

  return NextResponse.json(data, { status: 201 })
}
