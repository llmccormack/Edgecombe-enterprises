'use client'
import { useState } from 'react'
import { Settings } from '@/types'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide border-b border-stone-100 pb-3">
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function SettingsForm({ settings }: { settings: Settings | null }) {
  const s = settings
  const [companyAddress, setCompanyAddress] = useState(s?.company_address ?? '')
  const [companyPhone, setCompanyPhone] = useState(s?.company_phone ?? '')
  const [companyEmail, setCompanyEmail] = useState(s?.company_email ?? '')
  const [defaultTerms, setDefaultTerms] = useState(s?.default_payment_terms ?? 'Net 30')
  const [taxRate, setTaxRate] = useState(s ? (s.tax_rate * 100).toFixed(1) : '8.0')
  const [taxEnabled, setTaxEnabled] = useState(s?.tax_enabled ?? true)

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    setError(null)

    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_address: companyAddress,
        company_phone: companyPhone,
        company_email: companyEmail,
        default_payment_terms: defaultTerms,
        tax_rate: parseFloat(taxRate) / 100,
        tax_enabled: taxEnabled,
      }),
    })

    setLoading(false)
    if (res.ok) setSaved(true)
    else {
      const j = await res.json()
      setError(j.error ?? 'Failed to save')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saved && (
        <div className="bg-brand-50 border border-brand-200 text-brand-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Settings saved successfully!
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      <Section title="Company Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Company Address</label>
            <textarea
              value={companyAddress}
              onChange={e => setCompanyAddress(e.target.value)}
              rows={2}
              className="input"
              placeholder={"123 Your Street\nRochester, NY 14600"}
            />
            <p className="text-xs text-stone-400 mt-1">Printed on all invoices.</p>
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input type="tel" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)}
              className="input" placeholder="(585) 555-0100" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)}
              className="input" placeholder="info@edgecombeenterprises.com" />
          </div>
        </div>
      </Section>

      <Section title="Invoice Defaults">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Default Payment Terms</label>
            <select value={defaultTerms} onChange={e => setDefaultTerms(e.target.value)} className="input">
              {['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Default Tax Rate (%)</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-sm text-stone-600 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={taxEnabled}
                  onChange={e => setTaxEnabled(e.target.checked)}
                  className="rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                />
                Enabled
              </label>
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={e => setTaxRate(e.target.value)}
                  disabled={!taxEnabled}
                  className="input pr-6 disabled:opacity-50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">%</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto px-8">
          {loading ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </form>
  )
}
