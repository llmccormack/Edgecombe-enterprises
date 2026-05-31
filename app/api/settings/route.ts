import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const db = createServerClient()
  const { data, error } = await db.from('settings').select('*').limit(1).single()
  if (error) return NextResponse.json({}, { status: 200 }) // No settings yet
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const db = createServerClient()
  const body = await req.json()

  // Check if row exists
  const { data: existing } = await db.from('settings').select('id').limit(1).single()

  let result
  if (existing?.id) {
    result = await db
      .from('settings')
      .update({
        company_address: body.company_address ?? '',
        company_phone: body.company_phone ?? '',
        company_email: body.company_email ?? '',
        default_payment_terms: body.default_payment_terms ?? 'Net 30',
        twilio_account_sid: body.twilio_account_sid ?? '',
        twilio_auth_token: body.twilio_auth_token ?? '',
        twilio_whatsapp_number: body.twilio_whatsapp_number ?? '',
        twilio_sms_number: body.twilio_sms_number ?? '',
        tax_rate: body.tax_rate ?? 0.08,
        tax_enabled: body.tax_enabled ?? true,
      })
      .eq('id', existing.id)
      .select()
      .single()
  } else {
    result = await db
      .from('settings')
      .insert({
        company_address: body.company_address ?? '',
        company_phone: body.company_phone ?? '',
        company_email: body.company_email ?? '',
        default_payment_terms: body.default_payment_terms ?? 'Net 30',
        twilio_account_sid: body.twilio_account_sid ?? '',
        twilio_auth_token: body.twilio_auth_token ?? '',
        twilio_whatsapp_number: body.twilio_whatsapp_number ?? '',
        twilio_sms_number: body.twilio_sms_number ?? '',
        tax_rate: body.tax_rate ?? 0.08,
        tax_enabled: body.tax_enabled ?? true,
      })
      .select()
      .single()
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
  return NextResponse.json(result.data)
}
