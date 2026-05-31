'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Invoice } from '@/types'

export default function InvoiceActions({ invoice }: { invoice: Invoice }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function markPaid() {
    setLoading('paid')
    const res = await fetch(`/api/invoices/${invoice.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_paid' }),
    })
    const json = await res.json()
    setLoading(null)
    if (res.ok) {
      setMsg('Marked as paid!')
      router.refresh()
    } else {
      setMsg(json.error ?? 'Failed')
    }
  }

  async function sendReminder() {
    setLoading('reminder')
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: invoice.id, type: 'overdue' }),
    })
    const json = await res.json()
    setLoading(null)
    setMsg(res.ok ? 'Reminder sent!' : (json.error ?? 'Failed to send'))
  }

  async function downloadPDF() {
    setLoading('pdf')
    const res = await fetch(`/api/pdf/${invoice.id}`)
    setLoading(null)
    if (!res.ok) { setMsg('Failed to generate PDF'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoice.invoice_number}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function deleteInvoice() {
    if (!confirm(`Delete invoice ${invoice.invoice_number}? This cannot be undone.`)) return
    setLoading('delete')
    const res = await fetch(`/api/invoices/${invoice.id}`, { method: 'DELETE' })
    setLoading(null)
    if (res.ok) router.push('/invoices')
    else setMsg('Failed to delete')
  }

  return (
    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
      {msg && (
        <span className={`text-xs font-medium px-2 py-1 rounded ${msg.includes('!') ? 'bg-brand-100 text-brand-700' : 'bg-red-100 text-red-700'}`}>
          {msg}
        </span>
      )}

      <button onClick={downloadPDF} disabled={!!loading} className="btn-secondary flex-1 sm:flex-none justify-center">
        {loading === 'pdf' ? 'Generating…' : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </>
        )}
      </button>

      {invoice.status !== 'paid' && (
        <>
          <button onClick={sendReminder} disabled={!!loading} className="btn-secondary flex-1 sm:flex-none justify-center">
            {loading === 'reminder' ? 'Sending…' : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Reminder
              </>
            )}
          </button>

          <button onClick={markPaid} disabled={!!loading} className="btn-primary flex-1 sm:flex-none justify-center">
            {loading === 'paid' ? 'Saving…' : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mark as Paid
              </>
            )}
          </button>
        </>
      )}

      <button onClick={deleteInvoice} disabled={!!loading} className="btn-danger">
        {loading === 'delete' ? 'Deleting…' : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )}
      </button>
    </div>
  )
}
