'use client'
import Link from 'next/link'
import { format } from 'date-fns'
import { Invoice, InvoiceStatus } from '@/types'
import StatusBadge from './StatusBadge'
import { useState } from 'react'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

type SortKey = 'invoice_number' | 'client_name' | 'due_date' | 'total' | 'status'

export default function InvoiceTable({
  invoices,
  showGroupHeaders = false,
}: {
  invoices: Invoice[]
  showGroupHeaders?: boolean
}) {
  const [sortKey, setSortKey] = useState<SortKey>('due_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = invoices.filter(inv =>
    statusFilter === 'all' ? true : inv.status === statusFilter
  )

  const sorted = [...filtered].sort((a, b) => {
    let av: string | number = a[sortKey] ?? ''
    let bv: string | number = b[sortKey] ?? ''
    if (sortKey === 'total') { av = Number(av); bv = Number(bv) }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="ml-1 text-stone-400">
      {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  const groups: Record<string, Invoice[]> = showGroupHeaders
    ? {
        Overdue: sorted.filter(i => i.status === 'overdue'),
        Pending: sorted.filter(i => i.status === 'pending'),
        Paid: sorted.filter(i => i.status === 'paid'),
      }
    : { All: sorted }

  return (
    <div>
      {/* Filter pills */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {(['all', 'pending', 'overdue', 'paid'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              statusFilter === s
                ? 'bg-brand-700 text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {Object.entries(groups).map(([group, rows]) => {
        if (showGroupHeaders && rows.length === 0) return null
        return (
          <div key={group} className="mb-6">
            {showGroupHeaders && (
              <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-2">
                {group} ({rows.length})
              </h3>
            )}

            {rows.length === 0 ? (
              <div className="card p-8 text-center text-stone-400 text-sm">No invoices found</div>
            ) : (
              <>
                {/* Mobile card list */}
                <div className="md:hidden space-y-3">
                  {rows.map(inv => (
                    <Link key={inv.id} href={`/invoices/${inv.id}`}>
                      <div className="card p-4 active:bg-stone-50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold text-brand-700">{inv.invoice_number}</span>
                              <StatusBadge status={inv.status} />
                            </div>
                            <p className="text-sm font-semibold text-stone-900 mt-1 truncate">{inv.client_name}</p>
                            {inv.service_address && (
                              <p className="text-xs text-stone-400 truncate">{inv.service_address}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-base font-bold text-stone-900">{formatCurrency(inv.total)}</p>
                            <p className="text-xs text-stone-400 mt-0.5">Due {format(new Date(inv.due_date), 'MMM d')}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-stone-200">
                      <thead className="bg-stone-50">
                        <tr>
                          {([
                            ['invoice_number', 'Invoice #'],
                            ['client_name', 'Client'],
                            ['due_date', 'Due Date'],
                            ['total', 'Amount'],
                            ['status', 'Status'],
                          ] as [SortKey, string][]).map(([k, label]) => (
                            <th
                              key={k}
                              onClick={() => handleSort(k)}
                              className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide cursor-pointer hover:text-stone-800 select-none"
                            >
                              {label}<SortIcon k={k} />
                            </th>
                          ))}
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {rows.map(inv => (
                          <tr key={inv.id} className="hover:bg-stone-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-mono font-semibold text-brand-700">{inv.invoice_number}</td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-stone-900">{inv.client_name}</div>
                              <div className="text-xs text-stone-400">{inv.service_address}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-stone-600">{format(new Date(inv.due_date), 'MMM d, yyyy')}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-stone-900">{formatCurrency(inv.total)}</td>
                            <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                            <td className="px-4 py-3 text-right">
                              <Link href={`/invoices/${inv.id}`} className="text-xs font-medium text-brand-700 hover:underline">View →</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
