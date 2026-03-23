'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { profileSchema, type ProfileFormData } from '@/lib/schemas'
import { createClient } from '@/lib/supabase-client'
import type { Agent } from '@/lib/types'

interface ProfileFormProps {
  agent: Agent
}

export default function ProfileForm({ agent }: ProfileFormProps) {
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [brandColor, setBrandColor] = useState(agent.brand_color)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: agent.full_name,
      phone: agent.phone,
      bio: agent.bio ?? '',
      brand_color: agent.brand_color,
    },
  })

  const brandColorField = register('brand_color')

  async function onSubmit(data: ProfileFormData) {
    setSubmitError(null)
    setStatus('idle')

    const supabase = createClient()
    const { error } = await supabase
      .from('agents')
      .update({
        full_name: data.full_name,
        phone: data.phone,
        bio: data.bio?.trim() || null,
        brand_color: data.brand_color,
      })
      .eq('id', agent.id)

    if (error) {
      setSubmitError(error.message)
    }

    setStatus(error ? 'error' : 'saved')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
          <input
            type="text"
            {...register('full_name')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
          />
          {errors.full_name && (
            <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            {...register('phone')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio <span className="text-gray-400 font-normal">(shown on property pages)</span>
          </label>
          <textarea
            {...register('bio')}
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent resize-none"
            placeholder="Tell buyers about your experience and expertise..."
          />
          {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => {
                setBrandColor(e.target.value)
                setValue('brand_color', e.target.value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }}
              className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer p-1"
            />
            <input
              type="text"
              {...brandColorField}
              value={brandColor}
              onChange={(e) => {
                setBrandColor(e.target.value)
                brandColorField.onChange(e)
              }}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
              placeholder="#1a2e4a"
            />
          </div>
          {errors.brand_color && (
            <p className="text-red-500 text-xs mt-1">{errors.brand_color.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your URL slug</label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-gray-700">{agent.slug}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Your public profile page is coming soon.</p>
        </div>
      </div>

      {submitError && (
        <p className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-lg">{submitError}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light disabled:opacity-60 transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Save Profile'}
        </button>
        {status === 'saved' && <span className="text-green-600 text-sm font-medium">Saved</span>}
        {status === 'error' && (
          <span className="text-red-600 text-sm font-medium">Save failed</span>
        )}
      </div>
    </form>
  )
}
