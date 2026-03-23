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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-bold text-lg">ListingOS</span>
          {agent && (
            <span className="text-gray-300 text-sm">{agent.full_name}</span>
          )}
        </div>
      </header>

      {/* Photo gallery */}
      {typedListing.photo_urls.length > 0 ? (
        <PhotoGallery photos={typedListing.photo_urls} address={typedListing.address} />
      ) : (
        <div className="w-full h-72 bg-gray-100 flex items-center justify-center text-6xl">
          🏠
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Price & basics */}
            <div>
              <p className="text-3xl font-bold text-gold">{formatPrice(typedListing.price)}</p>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{typedListing.address}</h1>
              <div className="flex gap-6 mt-3 text-gray-600">
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="text-lg">🛏</span>
                  {typedListing.bedrooms} Bedrooms
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="text-lg">🚿</span>
                  {typedListing.bathrooms} Bathrooms
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="text-lg">📐</span>
                  {typedListing.square_footage.toLocaleString()} sq ft
                </span>
              </div>
            </div>

            {/* Features */}
            {typedListing.features.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-navy mb-3">Property Features</h2>
                <div className="flex flex-wrap gap-2">
                  {typedListing.features.map((f) => (
                    <span
                      key={f}
                      className="px-4 py-2 bg-navy/5 border border-navy/10 text-navy text-sm rounded-full font-medium"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {content?.mls_description && (
              <div>
                <h2 className="text-lg font-bold text-navy mb-3">About This Property</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {content.mls_description}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Agent card */}
            {agent && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  {agent.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={agent.logo_url}
                      alt={agent.full_name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
                      style={{ backgroundColor: agent.brand_color }}
                    >
                      {agent.full_name[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900">{agent.full_name}</p>
                    <p className="text-gray-500 text-sm">{agent.phone}</p>
                  </div>
                </div>
                {agent.bio && (
                  <p className="text-gray-600 text-sm mt-4 leading-relaxed">{agent.bio}</p>
                )}

                <div className="flex flex-col gap-3 mt-5">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-600 transition-colors"
                  >
                    <span>💬</span>
                    Book a Viewing on WhatsApp
                  </a>
                  <a
                    href={emailUrl}
                    className="flex items-center justify-center gap-2 border border-navy text-navy py-3 rounded-xl font-semibold text-sm hover:bg-navy hover:text-white transition-colors"
                  >
                    <span>✉️</span>
                    Enquire by Email
                  </a>
                </div>
              </div>
            )}

            {/* Share */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
              <p className="text-sm font-semibold text-gray-700 mb-2">Share this listing</p>
              <p className="text-xs text-gray-500 break-all select-all">
                {`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/listing/${id}`}
              </p>
            </div>

            {/* AI property chat */}
            <PropertyChat listingId={id} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-navy text-gray-400 py-8 px-6 mt-12">
        <div className="max-w-5xl mx-auto text-center text-sm">
          <p>Powered by <span className="text-white font-semibold">ListingOS</span></p>
        </div>
      </footer>
    </div>
  )
}
