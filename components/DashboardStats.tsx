'use client'

import { useEffect, useRef, useState } from 'react'

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
}

function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const start = performance.now()
    function step(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(ease * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return count
}

function StatCard({ label, value, icon }: StatCardProps) {
  const count = useCountUp(value)

  return (
    <div
      className="transition-all duration-200"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'var(--border-highlight)'
        el.style.boxShadow = 'var(--shadow-card)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'var(--border)'
        el.style.boxShadow = 'none'
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center mb-4"
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'var(--primary-muted)',
          color: 'var(--primary)',
        }}
      >
        {icon}
      </div>
      {/* Number */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 32,
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {count}
      </div>
      {/* Label */}
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
        {label}
      </p>
    </div>
  )
}

interface DashboardStatsProps {
  activeCount: number
  soldCount: number
  totalCount: number
  contentCount: number
}

export default function DashboardStats({
  activeCount,
  soldCount,
  totalCount,
  contentCount,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Active Listings"
        value={activeCount}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        }
      />
      <StatCard
        label="Properties Sold"
        value={soldCount}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        }
      />
      <StatCard
        label="Total Listings"
        value={totalCount}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        }
      />
      <StatCard
        label="Content Generated"
        value={contentCount}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
        }
      />
    </div>
  )
}
