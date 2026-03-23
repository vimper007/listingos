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
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
      setLoading(false)
    }
  }

  return (
    <div
      className="text-center"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 40,
      }}
    >
      <div
        style={{
          fontSize: 40,
          color: 'var(--primary)',
          marginBottom: 16,
          lineHeight: 1,
        }}
      >
        ◆
      </div>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          color: 'var(--text-primary)',
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        No content generated yet
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Content generation didn&apos;t complete during listing creation. Generate it now.
      </p>
      {error && (
        <p
          style={{
            color: 'var(--error)',
            fontSize: 14,
            background: 'var(--error-muted)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 16,
          }}
        >
          {error}
        </p>
      )}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="btn-gold inline-flex items-center gap-2"
        style={{
          height: 44,
          padding: '0 24px',
          borderRadius: 'var(--radius-md)',
          fontSize: 14,
          fontFamily: 'var(--font-body)',
        }}
      >
        {loading ? (
          <>
            <span
              style={{
                width: 14,
                height: 14,
                border: '2px solid rgba(10,10,15,0.3)',
                borderTopColor: '#0a0a0f',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            Generating…
          </>
        ) : (
          'Generate Content Now'
        )}
      </button>
    </div>
  )
}
