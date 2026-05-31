export type InvoiceStatus = 'pending' | 'overdue' | 'paid'

export interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
}

export interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  client_phone: string
  client_email: string
  service_address: string
  line_items: LineItem[]
  invoice_date: string
  due_date: string
  payment_terms: string
  notes: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  status: InvoiceStatus
  paid_at: string | null
  created_at: string
  updated_at: string
  last_reminder_sent_at: string | null
  reminder_count: number
}

export interface Settings {
  id: string
  company_address: string
  company_phone: string
  company_email: string
  default_payment_terms: string
  twilio_account_sid: string
  twilio_auth_token: string
  twilio_whatsapp_number: string
  twilio_sms_number: string
  tax_rate: number
  tax_enabled: boolean
  updated_at: string
}

export interface DashboardStats {
  total_outstanding: number
  total_overdue: number
  total_paid_this_month: number
  active_clients: number
}

export const COMMON_SERVICES = [
  // Landscape
  'Landscape Design & Installation',
  'Lawn Installation',
  'Hydroseeding',
  'Mulching',
  'Lawn Maintenance',
  'Seasonal Cleanup',
  'Fertilization',
  'Debris Hauling',
  // Hardscape
  'Patio Installation',
  'Driveway Pavers',
  'Walkway / Path Installation',
  'Retaining Wall',
  'Outdoor Steps',
  'Outdoor Living Space',
  'Stone Work',
  // Water & Drainage
  'Pond & Water Feature Installation',
  'Drainage Solutions',
  'Excavation & Grading',
  // Snow
  'Snow Plowing',
  'Snow Salting',
  'Snow Removal',
]
