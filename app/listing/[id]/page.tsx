import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'
import PhotoGallery from '@/components/PhotoGallery'
import PropertyChat from '@/components/PropertyChat'
import type { Agent, Listing, GeneratedContent } from '@/lib/types'

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('listings').select('address, price').eq('id', id).single()

  if (!data) return { title: 'Property Listing' }

  return {
    title: `${data.address} — ${formatPrice(data.price)}`,
    description: `View this property at ${data.address}`,
  }
}

export default async function PublicListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!listing) notFound()

  const typedListing = listing as Listing

  const [contentResult, agentResult] = await Promise.all([
    supabase
      .from('generated_content')
      .select('*')
      .eq('listing_id', id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single(),
    supabase.from('agents').select('*').eq('id', typedListing.agent_id).single(),
  ])

  const content = contentResult.data as GeneratedContent | null
  const agent = agentResult.data as Agent | null

  const whatsappNumber = agent?.phone.replace(/\D/g, '') ?? ''
  const whatsappMessage = encodeURIComponent(
    `Hi, I'm interested in the property at ${typedListing.address}. Can we arrange a viewing?`
  )
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
  const emailUrl = `mailto:${agent?.email ?? ''}?subject=${encodeURIComponent(`Enquiry: ${typedListing.address}`)}`

  const heroPhoto = typedListing.photo_urls[0]
  const remainingPhotos = typedListing.photo_urls.slice(1)

  const agentInitials = agent?.full_name
    ? agent.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="min-h-screen" style={{ background: '#ffffff', color: '#111111', fontFamily: 'var(--font-body)' }}>

      {/* ── HERO ──────────────────────────────────── */}
      <div
        className="relative"
        style={{ height: '70vh', minHeight: 400, overflow: 'hidden', background: '#111' }}
      >
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPhoto}
            alt={typedListing.address}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: '#1a1a2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 80, opacity: 0.15, color: '#c9a84c' }}>◆</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 80%, rgba(0,0,0,0.92) 100%)',
          }}
        />

        {/* Header bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '20px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: '#c9a84c', fontSize: 14 }}>◆</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#ffffff', fontWeight: 700 }}>
              ListingOS
            </span>
          </div>
          {agent && (
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{agent.full_name}</span>
          )}
        </div>

        {/* Price + Address overlaid bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            left: 40,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 42,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1,
              marginBottom: 8,
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            {formatPrice(typedListing.price)}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 20,
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 400,
            }}
          >
            {typedListing.address}
          </div>
        </div>

        {/* Bed/Bath/Sqft frosted pills bottom-right */}
        <div
          className="flex gap-2"
          style={{
            position: 'absolute',
            bottom: 36,
            right: 40,
          }}
        >
          {[
            `${typedListing.bedrooms} bed`,
            `${typedListing.bathrooms} bath`,
            `${typedListing.square_footage.toLocaleString()} sqft`,
          ].map((stat) => (
            <span
              key={stat}
              style={{
                backdropFilter: 'blur(8px)',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 999,
                padding: '6px 14px',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {stat}
            </span>
          ))}
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left column (65%) */}
          <div className="lg:col-span-2 space-y-10">

            {/* Remaining photos grid */}
            {remainingPhotos.length > 0 && (
              <PhotoGallery photos={remainingPhotos} address={typedListing.address} />
            )}

            {/* Features */}
            {typedListing.features.length > 0 && (
              <div>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    color: '#111111',
                    fontWeight: 700,
                    marginBottom: 16,
                    paddingTop: 4,
                    borderTop: '2px solid #c9a84c',
                    display: 'inline-block',
                    paddingRight: 20,
                  }}
                >
                  Property Features
                </h2>
                <div className="flex flex-wrap gap-2">
                  {typedListing.features.map((f) => (
                    <span
                      key={f}
                      style={{
                        padding: '6px 16px',
                        background: 'rgba(201,168,76,0.08)',
                        border: '1px solid rgba(201,168,76,0.25)',
                        color: '#8b6914',
                        borderRadius: 999,
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* About this property */}
            {content?.mls_description && (
              <div>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    color: '#111111',
                    fontWeight: 700,
                    marginBottom: 16,
                    paddingTop: 4,
                    borderTop: '2px solid #c9a84c',
                    display: 'inline-block',
                    paddingRight: 20,
                  }}
                >
                  About This Property
                </h2>
                <p
                  style={{
                    color: '#444',
                    fontSize: 16,
                    lineHeight: 1.8,
                    whiteSpace: 'pre-line',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {content.mls_description}
                </p>
              </div>
            )}
          </div>

          {/* Right column (35%) — sticky */}
          <div className="space-y-5 lg:sticky lg:top-8 lg:self-start">

            {/* Agent card */}
            {agent && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 20,
                  padding: 24,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                }}
              >
                {/* Agent info */}
                <div className="flex items-center gap-4 mb-4">
                  {agent.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={agent.logo_url}
                      alt={agent.full_name}
                      style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f3f4f6' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: '#c9a84c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0a0a0f',
                        fontSize: 18,
                        fontWeight: 700,
                        fontFamily: 'var(--font-display)',
                        flexShrink: 0,
                      }}
                    >
                      {agentInitials}
                    </div>
                  )}
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 17,
                        fontWeight: 700,
                        color: '#111111',
                      }}
                    >
                      {agent.full_name}
                    </p>
                    <p style={{ color: '#888', fontSize: 13 }}>Licensed Real Estate Agent</p>
                    <div className="flex gap-0.5 mt-1">
                      {[1,2,3,4,5].map((s) => (
                        <span key={s} style={{ color: '#c9a84c', fontSize: 14 }}>★</span>
                      ))}
                    </div>
                  </div>
                </div>

                {agent.bio && (
                  <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                    {agent.bio}
                  </p>
                )}

                <div className="flex flex-col gap-3">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                    style={{
                      height: 46,
                      background: 'linear-gradient(135deg, #c9a84c, #e0bf6e)',
                      color: '#0a0a0f',
                      borderRadius: 12,
                      fontWeight: 600,
                      fontSize: 14,
                      textDecoration: 'none',
                      transition: 'filter 0.2s, transform 0.2s',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Book a Viewing
                  </a>
                  <a
                    href={emailUrl}
                    className="flex items-center justify-center gap-2"
                    style={{
                      height: 46,
                      border: '1px solid #c9a84c',
                      color: '#c9a84c',
                      borderRadius: 12,
                      fontWeight: 600,
                      fontSize: 14,
                      textDecoration: 'none',
                      transition: 'background 0.2s',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    Send a Message
                  </a>
                </div>

                {/* Share */}
                <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 20, paddingTop: 16 }}>
                  <p style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>Share this listing</p>
                  <div className="flex gap-2">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        color: '#25D366',
                        textDecoration: 'none',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </a>
                    <a
                      href={emailUrl}
                      className="flex items-center justify-center"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        color: '#c9a84c',
                        textDecoration: 'none',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* AI property chat */}
            <PropertyChat listingId={id} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          background: '#f9f9f9',
          borderTop: '1px solid #e5e7eb',
          padding: '20px 24px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#aaa', fontSize: 13 }}>
          Powered by{' '}
          <span style={{ color: '#c9a84c', fontWeight: 600 }}>ListingOS</span>
        </p>
      </footer>
    </div>
  )
}
