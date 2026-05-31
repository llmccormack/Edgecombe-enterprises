'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { COMMON_SERVICES, LineItem } from '@/types'
import { format } from 'date-fns'

interface Props {
  defaultPaymentTerms: string
  defaultTaxRate: number
  taxEnabled: boolean
}

function newItem(): LineItem {
  return { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 }
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default function InvoiceForm({ defaultPaymentTerms, defaultTaxRate, taxEnabled: defaultTaxEnabled }: Props) {
  const router = useRouter()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [serviceAddress, setServiceAddress] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(today)
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return format(d, 'yyyy-MM-dd')
  })
  const [paymentTerms, setPaymentTerms] = useState(defaultPaymentTerms)
  const [notes, setNotes] = useState('')
  const [taxEnabled, setTaxEnabled] = useState(defaultTaxEnabled)
  const [taxRate, setTaxRate] = useState(defaultTaxRate)
  const [lineItems, setLineItems] = useState<LineItem[]>([newItem()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const taxAmount = taxEnabled ? subtotal * taxRate : 0
  const total = subtotal + taxAmount

  function updateItem(id: string, field: keyof LineItem, value: string | number) {
    setLineItems(items =>
      items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  function removeItem(id: string) {
    setLineItems(items => items.filter(i => i.id !== id))
  }

  function addItem() {
    setLineItems(items => [...items, newItem()])
  }

  function setServiceFromDropdown(id: string, service: string) {
    updateItem(id, 'description', service)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!clientName.trim()) { setError('Client name is required'); return }
    if (!clientPhone.trim()) { setError('Client phone is required'); return }
    if (lineItems.some(i => !i.description.trim())) { setError('All line items need a description'); return }
    if (lineItems.some(i => i.unit_price <= 0)) { setError('All line items need a price greater than $0'); return }

    setLoading(true)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        service_address: serviceAddress,
        invoice_date: invoiceDate,
        due_date: dueDate,
        payment_terms: paymentTerms,
        notes,
        tax_rate: taxEnabled ? taxRate : 0,
        line_items: lineItems,
        subtotal,
        tax_amount: taxAmount,
        total,
      }),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) { setError(json.error ?? 'Failed to create invoice'); return }
    router.push(`/invoices/${json.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Client Information */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide border-b border-stone-100 pb-3">
          Client Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Client Name *</label>
            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)}
              className="input" placeholder="John Smith" required />
          </div>
          <div>
            <label className="label">Phone Number *</label>
            <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)}
              className="input" placeholder="(555) 123-4567" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
              className="input" placeholder="john@example.com" />
          </div>
          <div>
            <label className="label">Service Address</label>
            <input type="text" value={serviceAddress} onChange={e => setServiceAddress(e.target.value)}
              className="input" placeholder="123 Main St, City, State" />
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide border-b border-stone-100 pb-3">
          Invoice Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Invoice Date *</label>
            <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)}
              className="input" required />
          </div>
          <div>
            <label className="label">Due Date *</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="input" required />
          </div>
          <div>
            <label className="label">Payment Terms</label>
            <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="input">
              {['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide border-b border-stone-100 pb-3">
          Line Items
        </h2>

        <div className="space-y-3">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-semibold text-stone-500 uppercase tracking-wide px-1">
            <div className="col-span-6">Service / Description</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-3 text-right">Unit Price</div>
            <div className="col-span-1" />
          </div>

          {lineItems.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 sm:gap-3 items-start">
              {/* Description + dropdown */}
              <div className="col-span-12 sm:col-span-6 space-y-1">
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                    className="input flex-1"
                    placeholder="Service description"
                    required
                  />
                  <select
                    value=""
                    onChange={e => setServiceFromDropdown(item.id, e.target.value)}
                    className="input w-8 px-0 text-center cursor-pointer flex-shrink-0"
                    title="Pick a common service"
                  >
                    <option value="" disabled>▼</option>
                    {COMMON_SERVICES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Qty */}
              <div className="col-span-4 sm:col-span-2">
                <label className="sm:hidden label text-xs">Qty</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))}
                  className="input text-center"
                  required
                />
              </div>

              {/* Unit price */}
              <div className="col-span-7 sm:col-span-3">
                <label className="sm:hidden label text-xs">Unit Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price || ''}
                    onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="input pl-7 text-right"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Remove */}
              <div className="col-span-1 flex items-end sm:items-center justify-end pb-0.5">
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={lineItems.length === 1}
                  className="text-stone-300 hover:text-red-500 disabled:opacity-30 transition-colors p-1"
                  title="Remove line"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Row subtotal */}
              {item.unit_price > 0 && (
                <div className="col-span-12 sm:hidden text-right text-xs text-stone-500 -mt-1 pr-7">
                  = {formatCurrency(item.quantity * item.unit_price)}
                </div>
              )}
            </div>
          ))}
        </div>

        <button type="button" onClick={addItem} className="btn-secondary text-xs">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Line Item
        </button>

        {/* Totals */}
        <div className="border-t border-stone-200 pt-4 space-y-2">
          <div className="flex justify-between items-center text-sm text-stone-600">
            <span>Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-stone-600">
                <input
                  type="checkbox"
                  checked={taxEnabled}
                  onChange={e => setTaxEnabled(e.target.checked)}
                  className="rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                />
                Tax
              </label>
              {taxEnabled && (
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={(taxRate * 100).toFixed(1)}
                    onChange={e => setTaxRate(parseFloat(e.target.value) / 100 || 0)}
                    className="input w-20 text-right pr-6 text-xs"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs">%</span>
                </div>
              )}
            </div>
            <span className="font-medium text-stone-600">{formatCurrency(taxAmount)}</span>
          </div>

          <div className="flex justify-between items-center text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
            <span>Total Due</span>
            <span className="text-brand-700 text-lg">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide border-b border-stone-100 pb-3 mb-4">
          Notes
        </h2>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="input"
          placeholder="Payment instructions, thank-you message, job details…"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary px-8">
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating…
            </>
          ) : 'Create Invoice & Send Notification'}
        </button>
      </div>
    </form>
  )
}
