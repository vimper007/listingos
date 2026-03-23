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
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image generation failed')
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
            AI Listing Photos
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Generate a free-tier AI photo based on listing details.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="btn-ghost-gold flex items-center gap-2"
          style={{
            height: 36,
            padding: '0 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontFamily: 'var(--font-body)',
            flexShrink: 0,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <>
              <span
                style={{
                  width: 12,
                  height: 12,
                  border: '2px solid rgba(201,168,76,0.3)',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Generating…
            </>
          ) : (
            'Generate Photo'
          )}
        </button>
      </div>
      {error && (
        <p style={{ color: 'var(--error)', fontSize: 12, marginTop: 10 }}>{error}</p>
      )}
    </div>
  )
}
