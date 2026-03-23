'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { Agent } from '@/lib/types'

interface ProfileFormProps {
  agent: Agent
}

export default function ProfileForm({ agent }: ProfileFormProps) {
  const [form, setForm] = useState({
    full_name: agent.full_name,
    phone: agent.phone,
    bio: agent.bio ?? '',
    brand_color: agent.brand_color,
  })
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  function handleField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setStatus('idle')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('agents')
      .update({
        full_name: form.full_name,
        phone: form.phone,
        bio: form.bio || null,
        brand_color: form.brand_color,
      })
      .eq('id', agent.id)

    setSaving(false)
    setStatus(error ? 'error' : 'saved')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
          <input
            type="text"
            required
            value={form.full_name}
            onChange={(e) => handleField('full_name', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => handleField('phone', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio{' '}
            <span className="text-gray-400 font-normal">(shown on property pages)</span>
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => handleField('bio', e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent resize-none"
            placeholder="Tell buyers about your experience and expertise..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.brand_color}
              onChange={(e) => handleField('brand_color', e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer p-1"
            />
            <input
              type="text"
              value={form.brand_color}
              onChange={(e) => handleField('brand_color', e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
              placeholder="#1a2e4a"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your URL slug</label>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">{process.env.NEXT_PUBLIC_APP_URL}/agent/</span>
            <span className="text-sm font-mono text-gray-900">{agent.slug}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
        {status === 'saved' && (
          <span className="text-green-600 text-sm font-medium">✓ Saved</span>
        )}
        {status === 'error' && (
          <span className="text-red-600 text-sm font-medium">Save failed</span>
        )}
      </div>
    </form>
  )
}
