'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GenerateImageButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Image generation failed')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image generation failed')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">AI Listing Photos</h3>
          <p className="text-xs text-gray-500 mt-1">
            Generate a free-tier AI photo based on listing details.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light disabled:opacity-60 transition-colors"
        >
          {loading ? 'Generatingâ€¦' : 'Generate Photo'}
        </button>
      </div>
      {error && <p className="text-red-600 text-xs mt-3">{error}</p>}
    </div>
  )
}
