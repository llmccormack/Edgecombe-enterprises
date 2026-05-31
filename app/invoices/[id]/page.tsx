import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Invoice } from '@/types'
import { format } from 'date-fns'
import StatusBadge from '@/components/StatusBadge'
import InvoiceActions from '@/components/InvoiceActions'
import Link from 'next/link'

export const revalidate = 0

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServerClient()
  const { data } = await db.from('invoices').select('*').eq('id', id).single()
  if (!data) notFound()
  const inv = data as Invoice

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <nav className="text-sm text-stone-500">
        <Link href="/" className="hover:text-brand-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link href="/invoices" className="hover:text-brand-700">Invoices</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-stone-800">{inv.invoice_number}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-stone-900 font-mono">{inv.invoice_number}</h1>
            <StatusBadge status={inv.status} />
          </div>
          <p className="text-sm text-stone-500 mt-1">Created {format(new Date(inv.created_at), 'MMMM d, yyyy')}</p>
        </div>
        <InvoiceActions invoice={inv} />
      </div>

      {/* Main card */}
      <div className="card divide-y divide-stone-100">
        {/* Client info */}
        <div className="p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Client Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-500">Name</p>
              <p className="text-sm font-semibold text-stone-900">{inv.client_name}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Phone</p>
              <p className="text-sm font-semibold text-stone-900">{inv.client_phone}</p>
            </div>
            {inv.client_email && (
              <div>
                <p className="text-xs text-stone-500">Email</p>
                <p className="text-sm font-semibold text-stone-900">{inv.client_email}</p>
              </div>
            )}
            {inv.service_address && (
              <div>
                <p className="text-xs text-stone-500">Service Address</p>
                <p className="text-sm font-semibold text-stone-900">{inv.service_address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Invoice details */}
        <div className="p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Invoice Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-stone-500">Invoice Date</p>
              <p className="text-sm font-semibold">{format(new Date(inv.invoice_date), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Due Date</p>
              <p className="text-sm font-semibold">{format(new Date(inv.due_date), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Payment Terms</p>
              <p className="text-sm font-semibold">{inv.payment_terms}</p>
            </div>
            {inv.paid_at && (
              <div>
                <p className="text-xs text-stone-500">Paid On</p>
                <p className="text-sm font-semibold text-brand-700">{format(new Date(inv.paid_at), 'MMM d, yyyy')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Line Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="pb-2 text-left text-xs font-semibold text-stone-500">Description</th>
                  <th className="pb-2 text-center text-xs font-semibold text-stone-500">Qty</th>
                  <th className="pb-2 text-right text-xs font-semibold text-stone-500">Unit Price</th>
                  <th className="pb-2 text-right text-xs font-semibold text-stone-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {inv.line_items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 text-sm text-stone-800">{item.description}</td>
                    <td className="py-2.5 text-sm text-center text-stone-600">{item.quantity}</td>
                    <td className="py-2.5 text-sm text-right text-stone-600">{formatCurrency(item.unit_price)}</td>
                    <td className="py-2.5 text-sm text-right font-medium text-stone-900">{formatCurrency(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-stone-200 ml-auto w-60 space-y-1.5">
            <div className="flex justify-between text-sm text-stone-600">
              <span>Subtotal</span>
              <span>{formatCurrency(inv.subtotal)}</span>
            </div>
            {inv.tax_amount > 0 && (
              <div className="flex justify-between text-sm text-stone-600">
                <span>Tax ({(inv.tax_rate * 100).toFixed(1)}%)</span>
                <span>{formatCurrency(inv.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
              <span>Total</span>
              <span className="text-brand-700">{formatCurrency(inv.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {inv.notes && (
          <div className="p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Notes</h2>
            <p className="text-sm text-stone-600 whitespace-pre-wrap">{inv.notes}</p>
          </div>
        )}

        {/* Reminder info */}
        <div className="p-6 bg-stone-50 rounded-b-xl">
          <div className="flex items-center gap-6 text-xs text-stone-500">
            <span>Reminders sent: <strong className="text-stone-700">{inv.reminder_count}</strong></span>
            {inv.last_reminder_sent_at && (
              <span>Last reminder: <strong className="text-stone-700">{format(new Date(inv.last_reminder_sent_at), 'MMM d, yyyy h:mm a')}</strong></span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
