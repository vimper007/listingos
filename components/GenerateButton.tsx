'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GenerateButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Generation failed')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
      setLoading(false)
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
      <p className="text-amber-800 font-semibold mb-1">No content generated yet</p>
      <p className="text-amber-700 text-sm mb-5">
        Content generation didn&apos;t complete during listing creation. Generate it now.
      </p>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light disabled:opacity-60 transition-colors"
      >
        {loading ? (
          <>
            <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating…
          </>
        ) : (
          'Generate Content Now'
        )}
      </button>
    </div>
  )
}
