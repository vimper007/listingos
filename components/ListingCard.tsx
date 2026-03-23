'use client'

import Link from 'next/link'
import type { Listing } from '@/lib/types'

export default function ListingCard({ listing }: { listing: Listing }) {
  const statusBadgeClass =
    listing.status === 'active'
      ? 'badge-active'
      : listing.status === 'sold'
      ? 'badge-sold'
      : 'badge-archived'

  const statusLabel =
    listing.status === 'active' ? 'Active' : listing.status === 'sold' ? 'Sold' : 'Archived'

  return (
    <div
      className="group overflow-hidden transition-all duration-250"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = 'var(--shadow-card)'
        el.style.borderColor = 'var(--border-highlight)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
        el.style.borderColor = 'var(--border)'
      }}
    >
      {/* Image with overlay */}
      <div className="relative" style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
        {listing.photo_urls.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.photo_urls[0]}
            alt={listing.address}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'var(--surface-raised)' }}
          >
            <span style={{ fontSize: 40, opacity: 0.3 }}>◆</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(10,10,15,0.8) 0%, transparent 60%)',
          }}
        />
        {/* Price bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 12,
            fontFamily: 'var(--font-mono)',
            fontSize: 17,
            fontWeight: 700,
            color: '#ffffff',
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
          }}
        >
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(listing.price)}
        </div>
        {/* Status badge top-right */}
        <div
          className={statusBadgeClass}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            padding: '3px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.03em',
          }}
        >
          {statusLabel}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: 16 }}>
        <p
          className="truncate font-semibold mb-1"
          style={{ color: 'var(--text-primary)', fontSize: 15 }}
        >
          {listing.address}
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {listing.bedrooms} bed&nbsp;&nbsp;·&nbsp;&nbsp;{listing.bathrooms} bath&nbsp;&nbsp;·&nbsp;&nbsp;{listing.square_footage.toLocaleString()} sqft
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <Link
            href={`/dashboard/listings/${listing.id}`}
            className="flex-1 flex items-center justify-center transition-all duration-150"
            style={{
              height: 34,
              border: '1px solid var(--primary)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--primary)',
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'var(--primary-muted)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'transparent'
            }}
          >
            View Content
          </Link>
          <Link
            href={`/listing/${listing.id}`}
            target="_blank"
            className="flex items-center gap-1 transition-colors"
            style={{
              height: 34,
              padding: '0 12px',
              color: 'var(--text-secondary)',
              fontSize: 13,
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.color = 'var(--text-secondary)'
            }}
          >
            Public ↗
          </Link>
        </div>
      </div>
    </div>
  )
}
