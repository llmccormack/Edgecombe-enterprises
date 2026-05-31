import { InvoiceStatus } from '@/types'

export default function StatusBadge({ status }: { status: InvoiceStatus }) {
  const styles: Record<InvoiceStatus, string> = {
    pending: 'bg-amber-100 text-amber-800 ring-amber-200',
    overdue: 'bg-red-100 text-red-800 ring-red-200',
    paid: 'bg-brand-100 text-brand-800 ring-brand-200',
  }
  const labels: Record<InvoiceStatus, string> = {
    pending: 'Pending',
    overdue: 'Overdue',
    paid: 'Paid',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'pending' ? 'bg-amber-500' :
        status === 'overdue' ? 'bg-red-500' : 'bg-brand-600'
      }`} />
      {labels[status]}
    </span>
  )
}
