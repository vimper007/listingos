'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { LISTING_FEATURES } from '@/lib/types'

interface FormData {
  address: string
  price: string
  bedrooms: string
  bathrooms: string
  square_footage: string
  features: string[]
  description: string
}

const initialForm: FormData = {
  address: '',
  price: '',
  bedrooms: '',
  bathrooms: '',
  square_footage: '',
  features: [],
  description: '',
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--primary)',
          fontWeight: 600,
          letterSpacing: '0.1em',
        }}
      >
        {number}
      </span>
      <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          color: 'var(--text-primary)',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {title}
      </h3>
      <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
    </div>
  )
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        marginBottom: 8,
        fontFamily: 'var(--font-body)',
      }}
    >
      {children}
    </label>
  )
}

export default function NewListingForm() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(initialForm)
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadHover, setUploadHover] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleFeature(feature: string) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }))
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 10 - photos.length)
    const newPreviews = files.map((f) => URL.createObjectURL(f))
    setPhotos((prev) => [...prev, ...files].slice(0, 10))
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, 10))
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index])
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      // 1. Get agent ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (!agent) throw new Error('Agent profile not found')

      // 2. Upload photos to Supabase Storage
      const photoUrls: string[] = []
      for (const photo of photos) {
        const ext = photo.name.split('.').pop()
        const path = `${agent.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('listing-photos')
          .upload(path, photo)
        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`)

        const { data: urlData } = supabase.storage.from('listing-photos').getPublicUrl(path)
        photoUrls.push(urlData.publicUrl)
      }

      // 3. Call /api/generate — creates listing + generates content
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agent.id,
          address: form.address,
          price: parseFloat(form.price),
          bedrooms: parseInt(form.bedrooms),
          bathrooms: parseInt(form.bathrooms),
          square_footage: parseInt(form.square_footage),
          features: form.features,
          description: form.description || null,
          photo_urls: photoUrls,
        }),
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string }
        throw new Error(data.error ?? 'Generation failed')
      }

      const result = await response.json() as { listing_id: string }
      router.push(`/dashboard/listings/${result.listing_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const formattedPrice = form.price
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(parseFloat(form.price) || 0)
    : null

  return (
    <div className="flex gap-8 items-start">
      {/* Form — left column */}
      <form onSubmit={handleSubmit} className="flex-1 min-w-0 space-y-6">
        {/* Section 01 — Property Details */}
        <section
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
          }}
        >
          <SectionHeader number="01" title="Property Details" />

          <div className="space-y-4">
            <div>
              <FormLabel>Address</FormLabel>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => handleField('address', e.target.value)}
                className="input-dark w-full"
                style={{ padding: '11px 14px', fontSize: 14 }}
                placeholder="123 Ocean Drive, Miami, FL 33139"
              />
            </div>

            <div>
              <FormLabel>Asking Price ($)</FormLabel>
              <input
                type="number"
                required
                min="0"
                value={form.price}
                onChange={(e) => handleField('price', e.target.value)}
                className="input-dark w-full"
                style={{ padding: '11px 14px', fontSize: 14, fontFamily: 'var(--font-mono)' }}
                placeholder="850000"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <FormLabel>Bedrooms</FormLabel>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.bedrooms}
                  onChange={(e) => handleField('bedrooms', e.target.value)}
                  className="input-dark w-full"
                  style={{ padding: '11px 14px', fontSize: 14 }}
                  placeholder="3"
                />
              </div>
              <div>
                <FormLabel>Bathrooms</FormLabel>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.bathrooms}
                  onChange={(e) => handleField('bathrooms', e.target.value)}
                  className="input-dark w-full"
                  style={{ padding: '11px 14px', fontSize: 14 }}
                  placeholder="2"
                />
              </div>
              <div>
                <FormLabel>Sq. Footage</FormLabel>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.square_footage}
                  onChange={(e) => handleField('square_footage', e.target.value)}
                  className="input-dark w-full"
                  style={{ padding: '11px 14px', fontSize: 14 }}
                  placeholder="2100"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 02 — Features */}
        <section
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
          }}
        >
          <SectionHeader number="02" title="Features" />
          <div className="flex flex-wrap gap-2">
            {LISTING_FEATURES.map((feature) => {
              const selected = form.features.includes(feature)
              return (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleFeature(feature)}
                  className={`pill-feature${selected ? ' selected' : ''}`}
                >
                  {feature}
                </button>
              )
            })}
          </div>

          <div className="mt-5">
            <FormLabel>Agent Notes (optional)</FormLabel>
            <textarea
              value={form.description}
              onChange={(e) => handleField('description', e.target.value)}
              rows={3}
              className="input-dark w-full"
              style={{ padding: '11px 14px', fontSize: 14, resize: 'none', lineHeight: 1.6 }}
              placeholder="e.g. Recently renovated kitchen, original hardwood floors..."
            />
          </div>
        </section>

        {/* Section 03 — Photos */}
        <section
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
          }}
        >
          <SectionHeader number="03" title="Photos" />

          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {previews.map((src, i) => (
                <div
                  key={i}
                  className="relative group"
                  style={{
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 flex items-center justify-center transition-opacity"
                    style={{
                      width: 20,
                      height: 20,
                      background: 'rgba(0,0,0,0.7)',
                      color: '#fff',
                      borderRadius: '50%',
                      fontSize: 12,
                      opacity: 0,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length < 10 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onMouseEnter={() => setUploadHover(true)}
              onMouseLeave={() => setUploadHover(false)}
              className="w-full flex flex-col items-center justify-center gap-3 transition-all duration-200"
              style={{
                border: `2px dashed ${uploadHover ? 'var(--primary)' : 'var(--border-highlight)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '32px 16px',
                background: uploadHover ? 'var(--primary-muted)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke={uploadHover ? 'var(--primary)' : 'var(--text-tertiary)'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <div>
                <p style={{ color: uploadHover ? 'var(--primary)' : 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
                  Drop photos here or click to upload
                </p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 4 }}>
                  Up to 10 photos — JPG, PNG, WebP
                </p>
              </div>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </section>

        {/* Section 04 — Generate */}
        <section
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
          }}
        >
          <SectionHeader number="04" title="Generate" />

          {error && (
            <p
              style={{
                color: 'var(--error)',
                fontSize: 14,
                background: 'var(--error-muted)',
                border: '1px solid rgba(248,113,113,0.2)',
                padding: '10px 16px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 16,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={loading ? 'shimmer-btn' : 'btn-gold'}
            style={{
              width: '100%',
              height: 52,
              borderRadius: 'var(--radius-md)',
              fontSize: 16,
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              background: loading ? undefined : 'linear-gradient(135deg, #c9a84c, #e0bf6e)',
              color: '#0a0a0f',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.85 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <span
                  className="inline-block"
                  style={{
                    width: 16,
                    height: 16,
                    border: '2px solid rgba(10,10,15,0.3)',
                    borderTopColor: '#0a0a0f',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Generating your content…
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                </svg>
                Generate Marketing Content
              </>
            )}
          </button>
        </section>
      </form>

      {/* Live preview — right column, hidden on mobile */}
      <div
        className="hidden xl:block"
        style={{ width: 300, flexShrink: 0, position: 'sticky', top: 24 }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            marginBottom: 12,
          }}
        >
          Live Preview
        </p>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          {/* Preview image */}
          <div
            style={{
              aspectRatio: '16/9',
              background: 'var(--surface-raised)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {previews[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previews[0]}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: 36, opacity: 0.15 }}>◆</span>
            )}
            {previews[0] && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(10,10,15,0.8) 0%, transparent 60%)',
                }}
              />
            )}
            {formattedPrice && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 10,
                  left: 12,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {formattedPrice}
              </div>
            )}
          </div>

          {/* Preview body */}
          <div style={{ padding: 14 }}>
            <p
              style={{
                color: form.address ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              {form.address || 'Property address'}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
              {form.bedrooms ? `${form.bedrooms} bed` : '– bed'}&nbsp;&nbsp;·&nbsp;&nbsp;
              {form.bathrooms ? `${form.bathrooms} bath` : '– bath'}&nbsp;&nbsp;·&nbsp;&nbsp;
              {form.square_footage ? `${parseInt(form.square_footage).toLocaleString()} sqft` : '– sqft'}
            </p>
            {form.features.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {form.features.slice(0, 4).map((f) => (
                  <span
                    key={f}
                    style={{
                      background: 'var(--primary-muted)',
                      color: 'var(--primary)',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: 11,
                    }}
                  >
                    {f}
                  </span>
                ))}
                {form.features.length > 4 && (
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
                    +{form.features.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <p
          style={{
            color: 'var(--text-tertiary)',
            fontSize: 11,
            textAlign: 'center',
            marginTop: 10,
          }}
        >
          Preview updates as you type
        </p>
      </div>
    </div>
  )
}
