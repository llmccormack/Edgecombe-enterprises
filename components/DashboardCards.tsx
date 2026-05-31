'use client'
import { DashboardStats } from '@/types'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

interface CardProps {
  title: string
  value: string
  sub?: string
  color: 'green' | 'red' | 'amber' | 'earth'
  icon: React.ReactNode
}

function StatCard({ title, value, sub, color, icon }: CardProps) {
  const colorMap = {
    green: 'bg-brand-50 border-brand-200 text-brand-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    earth: 'bg-earth-50 border-earth-200 text-earth-700',
  }
  const iconBg = {
    green: 'bg-brand-600',
    red: 'bg-red-600',
    amber: 'bg-amber-500',
    earth: 'bg-earth-600',
  }
  return (
    <div className={`card p-5 border ${colorMap[color].split(' ')[1]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{title}</p>
          <p className={`mt-1 text-2xl font-bold ${colorMap[color].split(' ')[2]}`}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-stone-400">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg[color]} flex items-center justify-center shadow-sm flex-shrink-0`}>
          <span className="text-white">{icon}</span>
        </div>
      </div>
    </div>
  )
}

export default function DashboardCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Outstanding"
        value={formatCurrency(stats.total_outstanding)}
        sub="Pending + Overdue"
        color="amber"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <StatCard
        title="Total Overdue"
        value={formatCurrency(stats.total_overdue)}
        sub="Past due date"
        color="red"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
      />
      <StatCard
        title="Paid This Month"
        value={formatCurrency(stats.total_paid_this_month)}
        sub={new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
        color="green"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <StatCard
        title="Active Clients"
        value={String(stats.active_clients)}
        sub="Unique clients with open invoices"
        color="earth"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      />
    </div>
  )
}
