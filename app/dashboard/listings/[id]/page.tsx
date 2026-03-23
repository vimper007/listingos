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

  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!agent) redirect('/auth/login')

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('agent_id', agent.id)
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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard"
          className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
        >
          ← Listings
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600 truncate">{typedListing.address}</span>
      </div>

      {/* Listing summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{typedListing.address}</h2>
            <p className="text-gold font-bold text-2xl mt-1">{formatPrice(typedListing.price)}</p>
            <p className="text-gray-500 text-sm mt-1">
              {typedListing.bedrooms} bed · {typedListing.bathrooms} bath ·{' '}
              {typedListing.square_footage.toLocaleString()} sqft
            </p>
            {typedListing.features.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {typedListing.features.map((f) => (
                  <span
                    key={f}
                    className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"
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
              className="w-32 h-24 object-cover rounded-xl shrink-0"
            />
          )}
        </div>
      </div>

      <div className="mb-8">
        <GenerateImageButton listingId={id} />
      </div>

      {/* Generated Content */}
      {generatedContent ? (
        <>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Generated Marketing Content</h3>
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
