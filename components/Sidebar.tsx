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
    <aside className="w-64 shrink-0 bg-navy min-h-screen flex flex-col">
      <div className="px-6 py-6 border-b border-navy-light">
        <h1 className="text-white text-xl font-bold">ListingOS</h1>
        {agent && (
          <p className="text-gray-400 text-sm mt-1 truncate">{agent.full_name}</p>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard' || pathname.startsWith('/dashboard/listings')
              : pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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

      <div className="px-4 pb-6">
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
