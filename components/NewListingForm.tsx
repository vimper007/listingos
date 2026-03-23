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

export default function NewListingForm() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(initialForm)
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Property details */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <h3 className="font-semibold text-gray-900">Property Details</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            required
            value={form.address}
            onChange={(e) => handleField('address', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
            placeholder="123 Ocean Drive, Miami, FL 33139"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Asking Price ($)</label>
          <input
            type="number"
            required
            min="0"
            value={form.price}
            onChange={(e) => handleField('price', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
            placeholder="850000"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
            <input
              type="number"
              required
              min="0"
              value={form.bedrooms}
              onChange={(e) => handleField('bedrooms', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
              placeholder="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
            <input
              type="number"
              required
              min="0"
              value={form.bathrooms}
              onChange={(e) => handleField('bathrooms', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
              placeholder="2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sq. Footage</label>
            <input
              type="number"
              required
              min="0"
              value={form.square_footage}
              onChange={(e) => handleField('square_footage', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
              placeholder="2100"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Features</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {LISTING_FEATURES.map((feature) => {
            const checked = form.features.includes(feature)
            return (
              <label
                key={feature}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border cursor-pointer text-sm transition-colors ${
                  checked
                    ? 'bg-navy/5 border-navy text-navy font-medium'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggleFeature(feature)}
                />
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center border text-xs ${
                    checked ? 'bg-navy border-navy text-white' : 'border-gray-300'
                  }`}
                >
                  {checked && '✓'}
                </span>
                {feature}
              </label>
            )
          })}
        </div>
      </section>

      {/* Agent Notes */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Agent Notes</h3>
        <p className="text-gray-500 text-xs mb-4">
          Anything special about this property? (optional)
        </p>
        <textarea
          value={form.description}
          onChange={(e) => handleField('description', e.target.value)}
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent resize-none"
          placeholder="e.g. Recently renovated kitchen, original hardwood floors, walking distance to top-rated schools..."
        />
      </section>

      {/* Photos */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Photos</h3>
        <p className="text-gray-500 text-xs mb-4">Up to 10 photos (JPG, PNG, WebP)</p>

        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
            {previews.map((src, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
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
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 text-sm text-gray-500 hover:border-navy hover:text-navy transition-colors"
          >
            <span className="block text-2xl mb-1">📸</span>
            Click to add photos
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

      {error && (
        <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gold text-white py-4 rounded-xl font-semibold text-base hover:bg-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating marketing content…
          </span>
        ) : (
          '✨ Generate Marketing'
        )}
      </button>
    </form>
  )
}
