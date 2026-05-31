import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { generateInvoicePDF } from '@/lib/pdf'
import { Invoice, Settings } from '@/types'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServerClient()

  const [{ data: invoiceData, error: invError }, { data: settingsData }] = await Promise.all([
    db.from('invoices').select('*').eq('id', id).single(),
    db.from('settings').select('*').limit(1).single(),
  ])

  if (invError || !invoiceData) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const invoice = invoiceData as Invoice
  const settings = settingsData as Settings | null

  const company = {
    address: settings?.company_address ?? '',
    phone: settings?.company_phone ?? '',
    email: settings?.company_email ?? '',
  }

  const pdfBuffer = generateInvoicePDF(invoice, company)

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
      'Content-Length': String(pdfBuffer.length),
    },
  })
}
