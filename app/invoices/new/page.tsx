import InvoiceForm from '@/components/InvoiceForm'
import { createServerClient } from '@/lib/supabase'
import { Settings } from '@/types'
import Link from 'next/link'

export default async function NewInvoicePage() {
  const db = createServerClient()
  const { data } = await db.from('settings').select('*').limit(1).single()
  const settings = data as Settings | null

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <nav className="text-sm text-stone-500">
        <Link href="/" className="hover:text-brand-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link href="/invoices" className="hover:text-brand-700">Invoices</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-stone-800">New Invoice</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-stone-900">Create New Invoice</h1>
        <p className="text-sm text-stone-500 mt-0.5">Fill in the details below to generate a new invoice.</p>
      </div>

      <InvoiceForm
        defaultPaymentTerms={settings?.default_payment_terms ?? 'Net 30'}
        defaultTaxRate={settings?.tax_rate ?? 0.08}
        taxEnabled={settings?.tax_enabled ?? true}
      />
    </div>
  )
}
