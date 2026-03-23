'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import type { Agent } from '@/lib/types'

interface SidebarProps {
  agent: Agent | null
}

const navItems = [
  { label: 'Listings', href: '/dashboard', icon: '🏠' },
  { label: 'Profile', href: '/dashboard/profile', icon: '👤' },
  { label: 'Billing', href: '/dashboard/billing', icon: '💳' },
]

export default function Sidebar({ agent }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="w-full shrink-0 bg-navy md:h-full md:w-64 flex flex-col">
      <div className="px-5 py-4 border-b border-navy-light flex items-center justify-between gap-4 md:block">
        <div>
          <h1 className="text-white text-lg font-bold md:text-xl">ListingOS</h1>
          {agent && (
            <p className="text-gray-400 text-xs mt-1 truncate md:text-sm">{agent.full_name}</p>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="md:hidden text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <span>🚪</span>
          Sign out
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 md:py-6 md:space-y-1 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard' || pathname.startsWith('/dashboard/listings')
              : pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 pb-6 mt-2 hidden md:block">
        {agent && (
          <div className="mb-4 px-3 py-2 bg-white/5 rounded-lg">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Plan</p>
            <p className="text-white text-sm font-medium capitalize mt-0.5">{agent.plan}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <span>🚪</span>
          Sign out
        </button>
      </div>
    </aside>
  )
}
