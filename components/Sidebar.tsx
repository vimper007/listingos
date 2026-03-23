'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import type { Agent } from '@/lib/types'

interface SidebarProps {
  agent: Agent | null
}

const navItems = [
  {
    label: 'Listings',
    href: '/dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/dashboard/profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    label: 'Billing',
    href: '/dashboard/billing',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
]

const planLabels: Record<string, string> = {
  trial: 'Free Trial',
  starter: 'Starter',
  pro: 'Pro',
  agency: 'Agency',
}

export default function Sidebar({ agent }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const initials = agent?.full_name
    ? agent.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0"
      style={{
        width: 240,
        minHeight: '100vh',
        position: 'sticky',
        top: 0,
        height: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--primary)', fontSize: 16, lineHeight: 1 }}>◆</span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              color: 'var(--primary)',
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            ListingOS
          </span>
        </div>
        <div
          className="mt-4"
          style={{
            height: 1,
            background: 'linear-gradient(90deg, var(--primary) 0%, transparent 80%)',
            opacity: 0.3,
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard' || pathname.startsWith('/dashboard/listings')
              : pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 transition-all duration-150"
              style={{
                height: 44,
                padding: '0 16px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--primary-muted)' : 'transparent',
                boxShadow: isActive ? 'inset 2px 0 0 var(--primary)' : 'none',
                fontSize: 14,
                fontWeight: isActive ? 500 : 400,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(201,168,76,0.07)'
                  el.style.color = 'var(--text-primary)'
                  el.style.boxShadow = 'inset 2px 0 0 var(--primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'transparent'
                  el.style.color = 'var(--text-secondary)'
                  el.style.boxShadow = 'none'
                }
              }}
            >
              <span style={{ opacity: isActive ? 1 : 0.65, display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: agent info + sign out */}
      <div className="px-3 pb-5 space-y-2">
        {agent && (
          <div
            className="flex items-center gap-3 px-3 py-3"
            style={{
              background: 'var(--surface-raised)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              className="flex items-center justify-center shrink-0 text-xs font-bold"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#0a0a0f',
                fontFamily: 'var(--font-display)',
                fontSize: 13,
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="truncate font-medium"
                style={{ color: 'var(--text-primary)', fontSize: 13 }}
              >
                {agent.full_name}
              </p>
              <span
                style={{
                  color: 'var(--primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                }}
              >
                {planLabels[agent.plan] ?? agent.plan}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 transition-all duration-150"
          style={{
            height: 40,
            padding: '0 12px',
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary)',
            fontSize: 13,
            cursor: 'pointer',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.color = 'var(--error)'
            el.style.background = 'var(--error-muted)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.color = 'var(--text-tertiary)'
            el.style.background = 'transparent'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )
}
