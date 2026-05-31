import twilio from 'twilio'
import { Invoice } from '@/types'
import { format } from 'date-fns'

function getClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) return null
  return twilio(accountSid, authToken)
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function buildMessage(type: 'created' | 'reminder_3day' | 'due_today' | 'overdue', invoice: Invoice): string {
  const amount = formatAmount(invoice.total)
  const dueDate = format(new Date(invoice.due_date), 'MMMM d')
  const name = invoice.client_name.split(' ')[0]

  switch (type) {
    case 'created':
      return `Hi ${name}, this is Edgecombe Enterprises. Invoice #${invoice.invoice_number} for ${amount} has been created and is due on ${dueDate}. Thank you for your business! Please call or reply with any questions.`
    case 'reminder_3day':
      return `Hi ${name}, this is Edgecombe Enterprises. A friendly reminder that Invoice #${invoice.invoice_number} for ${amount} is due in 3 days on ${dueDate}. Please call or reply with any questions.`
    case 'due_today':
      return `Hi ${name}, this is Edgecombe Enterprises. Invoice #${invoice.invoice_number} for ${amount} is due today. Please remit payment at your earliest convenience or reply with any questions.`
    case 'overdue':
      return `Hi ${name}, this is Edgecombe Enterprises. Invoice #${invoice.invoice_number} for ${amount} is past due. Please arrange payment as soon as possible or call us to discuss. Thank you.`
  }
}

export async function sendReminder(
  invoice: Invoice,
  type: 'created' | 'reminder_3day' | 'due_today' | 'overdue'
): Promise<{ success: boolean; sid?: string; error?: string }> {
  const client = getClient()
  if (!client) return { success: false, error: 'Twilio not configured' }

  const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER
  const smsFrom = process.env.TWILIO_SMS_NUMBER
  const to = invoice.client_phone.replace(/\D/g, '')
  if (!to) return { success: false, error: 'No phone number on invoice' }

  const body = buildMessage(type, invoice)

  // Try WhatsApp first, fall back to SMS
  if (whatsappFrom) {
    try {
      const msg = await client.messages.create({
        body,
        from: `whatsapp:${whatsappFrom}`,
        to: `whatsapp:+1${to}`,
      })
      return { success: true, sid: msg.sid }
    } catch {
      // Fall through to SMS
    }
  }

  if (smsFrom) {
    try {
      const msg = await client.messages.create({
        body,
        from: smsFrom,
        to: `+1${to}`,
      })
      return { success: true, sid: msg.sid }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  return { success: false, error: 'No Twilio sending number configured' }
}
