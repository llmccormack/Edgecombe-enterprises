import { createServerClient } from './supabase'
import { Invoice } from '@/types'

export async function getNextInvoiceNumber(): Promise<string> {
  const db = createServerClient()
  const { data } = await db
    .from('invoices')
    .select('invoice_number')
    .order('created_at', { ascending: false })
    .limit(1)

  if (!data || data.length === 0) return 'EE-001'

  const last = data[0].invoice_number
  const match = last.match(/EE-(\d+)/)
  if (!match) return 'EE-001'

  const next = parseInt(match[1], 10) + 1
  return `EE-${String(next).padStart(3, '0')}`
}

export async function markOverdueInvoices(): Promise<number> {
  const db = createServerClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await db
    .from('invoices')
    .update({ status: 'overdue' })
    .eq('status', 'pending')
    .lt('due_date', today)
    .select()

  if (error) throw error
  return data?.length ?? 0
}

export async function getInvoicesDueForReminder(): Promise<Invoice[]> {
  const db = createServerClient()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const in3Days = new Date(today)
  in3Days.setDate(in3Days.getDate() + 3)
  const in3DaysStr = in3Days.toISOString().split('T')[0]

  const { data, error } = await db
    .from('invoices')
    .select('*')
    .neq('status', 'paid')

  if (error) throw error
  if (!data) return []

  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

  return (data as Invoice[]).filter(inv => {
    const lastSent = inv.last_reminder_sent_at
      ? new Date(inv.last_reminder_sent_at).getTime()
      : 0
    const hoursSinceLast = (now - lastSent) / (1000 * 60 * 60)

    // Don't spam — require at least 12 hours between any reminders
    if (hoursSinceLast < 12) return false

    if (inv.status === 'overdue') {
      // Every 7 days after becoming overdue
      return now - lastSent >= sevenDaysMs
    }

    if (inv.due_date === todayStr) return true
    if (inv.due_date === in3DaysStr) return true

    return false
  })
}

export function getReminderType(
  invoice: Invoice
): 'reminder_3day' | 'due_today' | 'overdue' {
  const today = new Date().toISOString().split('T')[0]
  const in3Days = new Date()
  in3Days.setDate(in3Days.getDate() + 3)
  const in3DaysStr = in3Days.toISOString().split('T')[0]

  if (invoice.status === 'overdue') return 'overdue'
  if (invoice.due_date === today) return 'due_today'
  if (invoice.due_date === in3DaysStr) return 'reminder_3day'
  return 'reminder_3day'
}
