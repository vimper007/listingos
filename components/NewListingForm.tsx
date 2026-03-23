'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  newListingSchema,
  type NewListingFormData,
  type NewListingFormInput,
} from '@/lib/schemas'
import { createClient } from '@/lib/supabase-client'
import { LISTING_FEATURES } from '@/lib/types'

const SEED_PHOTO_FILES = [
  'allphoto-bangkok-nI4aC1kaTRc-unsplash.jpg',
  'Gemini_Generated_Image_gwkw9wgwkw9wgwkw.png',
  'kuldeep-swarnkaar-g1pCP0kViMI-unsplash.jpg',
  'luke-van-zyl-koH7IVuwRLw-unsplash.jpg',
  'matthew-1tT3RNJ8wwc-unsplash.jpg',
  'nguy-n-trung-hi-u-yTh1N_noTLU-unsplash.jpg',
  'photo-1615460549969-36fa19521a4f.avif',
  'samnang-mao-dDusMg7C564-unsplash.jpg',
]

export default function NewListingForm() {
  const router = useRouter()
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [seedLoading, setSeedLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewListingFormInput, undefined, NewListingFormData>({
    resolver: zodResolver(newListingSchema),
    defaultValues: {
      address: '',
      features: [],
      description: '',
    },
  })

  const selectedFeatures = watch('features') ?? []

  async function loadSeedListing() {
    if (seedLoading) return

    setSeedLoading(true)
    setSubmitError(null)

    try {
      const response = await fetch('/seed/description.json', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to load sample listing')
      }

      const data = (await response.json()) as {
        properties_list?: Array<{
          address?: string
          asking_price_usd?: number
          bedrooms?: number
          bathrooms?: number
          sq_footage?: number
          features?: string[]
          agent_notes?: string
        }>
      }

      const seed = data.properties_list?.[0]
      if (!seed) {
        throw new Error('No sample listing found')
      }

      reset({
        address: seed.address ?? '',
        price: seed.asking_price_usd ?? 0,
        bedrooms: seed.bedrooms ?? 1,
        bathrooms: Math.round(seed.bathrooms ?? 1),
        square_footage: seed.sq_footage ?? 0,
        features: seed.features ?? [],
        description: seed.agent_notes ?? '',
      })

      previews.forEach((src) => URL.revokeObjectURL(src))

      const files = await Promise.all(
        SEED_PHOTO_FILES.map(async (name) => {
          const photoResponse = await fetch(`/seed/photos/${name}`)
          if (!photoResponse.ok) {
            throw new Error(`Failed to load sample photo: ${name}`)
          }
          const blob = await photoResponse.blob()
          return new File([blob], name, { type: blob.type || 'image/jpeg' })
        })
      )

      const newPreviews = files.map((file) => URL.createObjectURL(file))
      setPhotos(files)
      setPreviews(newPreviews)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to load sample listing')
    } finally {
      setSeedLoading(false)
    }
  }

  function toggleFeature(feature: string) {
    const next = selectedFeatures.includes(feature)
      ? selectedFeatures.filter((item) => item !== feature)
      : [...selectedFeatures, feature]

    setValue('features', next, { shouldDirty: true, shouldValidate: true })
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 10 - photos.length)
    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setPhotos((prev) => [...prev, ...files].slice(0, 10))
    setPreviews((prev) => [...prev, ...newPreviews].slice(0, 10))
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index])
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function onSubmit(data: NewListingFormData) {
    setSubmitError(null)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!agent) throw new Error('Agent profile not found')

      const photoUrls: string[] = []
      for (const photo of photos) {
        const ext = photo.name.split('.').pop()
        const path = `${agent.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('listing-photos')
          .upload(path, photo)

        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage.from('listing-photos').getPublicUrl(path)
        photoUrls.push(urlData.publicUrl)
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agent.id,
          address: data.address,
          price: data.price,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          square_footage: data.square_footage,
          features: data.features,
          description: data.description?.trim() || null,
          photo_urls: photoUrls,
        }),
      })

      if (!response.ok) {
        const responseData = (await response.json()) as { error?: string }
        throw new Error(responseData.error ?? 'Generation failed')
      }

      const result = (await response.json()) as { listing_id: string }
      router.push(`/dashboard/listings/${result.listing_id}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="bg-navy/5 border border-navy/10 rounded-2xl px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-navy">Quick start</p>
          <p className="text-xs text-gray-600 mt-1">
            Prefill the form with a sample listing and photos to see how the generator works.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSeedListing}
          disabled={seedLoading}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white border border-navy/20 text-navy hover:border-navy hover:bg-navy/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {seedLoading ? 'Loading sample...' : 'Use sample listing'}
        </button>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <h3 className="font-semibold text-gray-900">Property Details</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            {...register('address')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
            placeholder="123 Ocean Drive, Miami, FL 33139"
          />
          {errors.address && (
            <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Asking Price ($)</label>
          <input
            type="number"
            min="1"
            step="1"
            {...register('price')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
            placeholder="850000"
          />
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
            <input
              type="number"
              min="1"
              step="1"
              {...register('bedrooms')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
              placeholder="3"
            />
            {errors.bedrooms && (
              <p className="text-red-500 text-xs mt-1">{errors.bedrooms.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
            <input
              type="number"
              min="1"
              step="1"
              {...register('bathrooms')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
              placeholder="2"
            />
            {errors.bathrooms && (
              <p className="text-red-500 text-xs mt-1">{errors.bathrooms.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sq. Footage</label>
            <input
              type="number"
              min="1"
              step="1"
              {...register('square_footage')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
              placeholder="2100"
            />
            {errors.square_footage && (
              <p className="text-red-500 text-xs mt-1">{errors.square_footage.message}</p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Features</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {LISTING_FEATURES.map((feature) => {
            const checked = selectedFeatures.includes(feature)

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
                  {checked && 'x'}
                </span>
                {feature}
              </label>
            )
          })}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Agent Notes</h3>
        <p className="text-gray-500 text-xs mb-4">Anything special about this property? (optional)</p>
        <textarea
          {...register('description')}
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent resize-none"
          placeholder="e.g. Recently renovated kitchen, original hardwood floors, walking distance to top-rated schools..."
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Photos</h3>
        <p className="text-gray-500 text-xs mb-4">Up to 10 photos (JPG, PNG, WebP)</p>

        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
            {previews.map((src, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  x
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

      {submitError && (
        <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">{submitError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gold text-white py-4 rounded-xl font-semibold text-base hover:bg-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating marketing content...
          </span>
        ) : (
          'Generate Marketing'
        )}
      </button>
    </form>
  )
}
