import { createServerClient } from '@/lib/supabase'
import InvoiceTable from '@/components/InvoiceTable'
import Link from 'next/link'
import { Invoice } from '@/types'

export const revalidate = 0

export default async function InvoicesPage() {
  const db = createServerClient()
  const { data } = await db
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })

  const invoices = (data ?? []) as Invoice[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Invoices</h1>
          <p className="text-sm text-stone-500">{invoices.length} total invoice{invoices.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/invoices/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-stone-700">No invoices yet</h3>
          <p className="text-sm text-stone-400 mt-1 mb-4">Create your first invoice to get started.</p>
          <Link href="/invoices/new" className="btn-primary">Create Invoice</Link>
        </div>
      ) : (
        <InvoiceTable invoices={invoices} />
      )}
    </div>
  )
}
