import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { Listing } from '@/lib/types'
import DashboardStats from '@/components/DashboardStats'
import ListingCard from '@/components/ListingCard'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: agent } = await supabase
    .from('agents')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single()

  if (!agent) redirect('/auth/login')

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })

  const items = (listings ?? []) as Listing[]

  const firstName = (agent as { id: string; full_name: string }).full_name.split(' ')[0]
  const activeCount = items.filter((l) => l.status === 'active').length
  const soldCount = items.filter((l) => l.status === 'sold').length
  const totalCount = items.length
  const contentCount = items.length

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              color: 'var(--text-primary)',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {getGreeting()}, {firstName}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
            {formatDate()}
          </p>
        </div>
        <Link
          href="/dashboard/listings/new"
          className="btn-gold flex items-center gap-2"
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(201,168,76,0.25)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Listing
        </Link>
      </div>

      {/* Stats row */}
      <DashboardStats
        activeCount={activeCount}
        soldCount={soldCount}
        totalCount={totalCount}
        contentCount={contentCount}
      />

      {/* Listings grid */}
      <div className="mt-10">
        <h2
          className="mb-6"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            color: 'var(--text-primary)',
            fontWeight: 600,
          }}
        >
          Your Listings
        </h2>

        {items.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div style={{ fontSize: 64, color: 'var(--primary)', lineHeight: 1, marginBottom: 20 }}>◆</div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                color: 'var(--text-primary)',
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Your listings will appear here
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
              Add your first property to generate marketing content instantly.
            </p>
            <Link
              href="/dashboard/listings/new"
              style={{
                background: 'linear-gradient(135deg, #c9a84c, #e0bf6e)',
                color: '#0a0a0f',
                padding: '12px 28px',
                borderRadius: 'var(--radius-md)',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Add New Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
