import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import ContentTabs from '@/components/ContentTabs'
import GenerateButton from '@/components/GenerateButton'
import GenerateImageButton from '@/components/GenerateImageButton'
import type { Listing, GeneratedContent } from '@/lib/types'

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()

  if (!listing) notFound()

  const typedListing = listing as Listing

  const { data: generatedContent } = await supabase
    .from('generated_content')
    .select('*')
    .eq('listing_id', id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="p-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8">
        <Link href="/dashboard" className="breadcrumb-back">
          ← Listings
        </Link>
        <span style={{ color: 'var(--border-highlight)' }}>/</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: 14 }} className="truncate">
          {typedListing.address}
        </span>
      </div>

      {/* Listing summary card */}
      <div
        className="mb-6"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                color: 'var(--text-primary)',
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              {typedListing.address}
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--primary)',
                marginBottom: 6,
              }}
            >
              {formatPrice(typedListing.price)}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {typedListing.bedrooms} bed&nbsp;&nbsp;·&nbsp;&nbsp;{typedListing.bathrooms} bath&nbsp;&nbsp;·&nbsp;&nbsp;
              {typedListing.square_footage.toLocaleString()} sqft
            </p>
            {typedListing.features.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {typedListing.features.map((f) => (
                  <span
                    key={f}
                    style={{
                      background: 'var(--primary-muted)',
                      color: 'var(--primary)',
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
          {typedListing.photo_urls.length > 0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={typedListing.photo_urls[0]}
              alt={typedListing.address}
              style={{
                width: 120,
                height: 90,
                objectFit: 'cover',
                borderRadius: 'var(--radius-md)',
                flexShrink: 0,
                border: '1px solid var(--border)',
              }}
            />
          )}
        </div>
      </div>

      <div className="mb-6">
        <GenerateImageButton listingId={id} />
      </div>

      {/* Generated Content */}
      {generatedContent ? (
        <>
          <h3
            className="mb-4"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              color: 'var(--text-primary)',
              fontWeight: 600,
            }}
          >
            Marketing Content
          </h3>
          <ContentTabs
            initialContent={generatedContent as GeneratedContent}
            listingId={id}
          />
        </>
      ) : (
        <GenerateButton listingId={id} />
      )}
    </div>
  )
}
