import { createServerClient } from '@/lib/supabase'
import { Settings } from '@/types'
import SettingsForm from '@/components/SettingsForm'
import Link from 'next/link'

export const revalidate = 0

export default async function SettingsPage() {
  const db = createServerClient()
  const { data } = await db.from('settings').select('*').limit(1).single()
  const settings = data as Settings | null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <nav className="text-sm text-stone-500">
        <Link href="/" className="hover:text-brand-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-stone-800">Settings</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
        <p className="text-sm text-stone-500">Configure your company info, tax defaults, and messaging integrations.</p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  )
}
