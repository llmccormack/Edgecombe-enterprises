'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/invoices',
    label: 'Invoices',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/invoices/new',
    label: 'New',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
    primary: true,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <>
      {/* Top bar */}
      <header className="bg-brand-800 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">Edgecombe Enterprises</div>
              <div className="text-brand-300 text-xs leading-tight">Rochester, NY · Est. 1997</div>
            </div>
          </Link>

          {/* Desktop nav only */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map(tab => {
              const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab.primary
                      ? 'bg-earth-600 hover:bg-earth-700 text-white'
                      : active
                      ? 'bg-brand-700 text-white'
                      : 'text-brand-200 hover:text-white hover:bg-brand-700'
                  }`}
                >
                  {tab.primary ? '+ New Invoice' : tab.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-lg">
        <div className="flex">
          {tabs.map(tab => {
            const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
            if (tab.primary) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
                >
                  <div className="w-12 h-12 rounded-full bg-brand-700 flex items-center justify-center shadow-lg -mt-5 ring-4 ring-white">
                    <span className="text-white">{tab.icon}</span>
                  </div>
                  <span className="text-xs font-semibold text-brand-700 mt-0.5">{tab.label}</span>
                </Link>
              )
            }
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
                  active ? 'text-brand-700' : 'text-stone-400'
                }`}
              >
                {tab.icon}
                <span className="text-xs font-medium">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile bottom padding so content isn't hidden behind tab bar */}
      <div className="md:hidden h-20" aria-hidden />
    </>
  )
}
