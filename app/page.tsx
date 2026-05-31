import { createServerClient } from '@/lib/supabase'
import DashboardCards from '@/components/DashboardCards'
import InvoiceTable from '@/components/InvoiceTable'
import Link from 'next/link'
import { Invoice } from '@/types'
import { startOfMonth } from 'date-fns'

export const revalidate = 0

export default async function DashboardPage() {
  const db = createServerClient()

  const { data: invoices } = await db
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })

  const all = (invoices ?? []) as Invoice[]

  const monthStart = startOfMonth(new Date()).toISOString()
  const totalOutstanding = all
    .filter(i => i.status !== 'paid')
    .reduce((s, i) => s + Number(i.total), 0)
  const totalOverdue = all
    .filter(i => i.status === 'overdue')
    .reduce((s, i) => s + Number(i.total), 0)
  const totalPaidThisMonth = all
    .filter(i => i.status === 'paid' && i.paid_at && i.paid_at >= monthStart)
    .reduce((s, i) => s + Number(i.total), 0)
  const activeClients = new Set(
    all.filter(i => i.status !== 'paid').map(i => i.client_name)
  ).size

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/invoices/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </Link>
      </div>

      {/* Stats */}
      <DashboardCards stats={{ total_outstanding: totalOutstanding, total_overdue: totalOverdue, total_paid_this_month: totalPaidThisMonth, active_clients: activeClients }} />

      {/* Invoice table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-800">All Invoices</h2>
          <Link href="/invoices" className="text-sm text-brand-700 hover:underline">
            View all →
          </Link>
        </div>
        {all.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-stone-700">No invoices yet</h3>
            <p className="text-sm text-stone-400 mt-1">Create your first invoice to get started.</p>
            <Link href="/invoices/new" className="btn-primary mt-4 inline-flex">
              Create Invoice
            </Link>
          </div>
        ) : (
          <InvoiceTable invoices={all} showGroupHeaders />
        )}
      </div>
    </div>
  )
}
