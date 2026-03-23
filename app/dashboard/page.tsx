import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { Listing } from '@/lib/types'

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

const statusColors: Record<Listing['status'], string> = {
  active: 'bg-green-100 text-green-700',
  sold: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-600',
}

export default async function DashboardPage() {
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

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })

  const items = (listings ?? []) as Listing[]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Listings</h2>
          <p className="text-gray-500 text-sm mt-1">{items.length} listing{items.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/dashboard/listings/new"
          className="bg-navy text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors"
        >
          + Add New Listing
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-200">
          <div className="text-5xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No listings yet</h3>
          <p className="text-gray-500 mb-6 text-sm">
            Add your first listing to generate marketing content instantly.
          </p>
          <Link
            href="/dashboard/listings/new"
            className="bg-navy text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors inline-block"
          >
            Add New Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {listing.photo_urls.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.photo_urls[0]}
                  alt={listing.address}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-4xl">
                  🏠
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                    {listing.address}
                  </p>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[listing.status]}`}
                  >
                    {listing.status}
                  </span>
                </div>
                <p className="text-gold font-bold text-lg">{formatPrice(listing.price)}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {listing.bedrooms} bed · {listing.bathrooms} bath · {listing.square_footage.toLocaleString()} sqft
                </p>
                <Link
                  href={`/dashboard/listings/${listing.id}`}
                  className="mt-4 block text-center bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy hover:text-white hover:border-navy transition-colors"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
