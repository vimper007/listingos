'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { Agent } from '@/lib/types'

interface ProfileFormProps {
  agent: Agent
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
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
        }}
        className="space-y-5"
      >
        <div>
          <FormLabel>Full name</FormLabel>
          <input
            type="text"
            required
            value={form.full_name}
            onChange={(e) => handleField('full_name', e.target.value)}
            className="input-dark w-full"
            style={{ padding: '11px 14px', fontSize: 14 }}
          />
        </div>

        <div>
          <FormLabel>Phone</FormLabel>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => handleField('phone', e.target.value)}
            className="input-dark w-full"
            style={{ padding: '11px 14px', fontSize: 14 }}
          />
        </div>

        <div>
          <FormLabel>
            Bio <span style={{ textTransform: 'none', opacity: 0.6 }}>(shown on property pages)</span>
          </FormLabel>
          <textarea
            value={form.bio}
            onChange={(e) => handleField('bio', e.target.value)}
            rows={4}
            className="input-dark w-full"
            style={{ padding: '11px 14px', fontSize: 14, resize: 'none', lineHeight: 1.6 }}
            placeholder="Tell buyers about your experience and expertise..."
          />
        </div>

        <div>
          <FormLabel>Brand color</FormLabel>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.brand_color}
              onChange={(e) => handleField('brand_color', e.target.value)}
              style={{
                width: 44,
                height: 40,
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                padding: 3,
                background: 'var(--surface-raised)',
              }}
            />
            <input
              type="text"
              value={form.brand_color}
              onChange={(e) => handleField('brand_color', e.target.value)}
              className="input-dark flex-1"
              style={{
                padding: '11px 14px',
                fontSize: 14,
                fontFamily: 'var(--font-mono)',
              }}
              placeholder="#c9a84c"
            />
          </div>
        </div>

        <div>
          <FormLabel>Your URL slug</FormLabel>
          <div
            className="flex items-center gap-2"
            style={{
              padding: '11px 14px',
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
            }}
          >
            <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {process.env.NEXT_PUBLIC_APP_URL}/agent/
            </span>
            <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
              {agent.slug}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="btn-gold"
          style={{
            height: 42,
            padding: '0 24px',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            fontFamily: 'var(--font-body)',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
        {status === 'saved' && (
          <span style={{ color: 'var(--success)', fontSize: 14, fontWeight: 500 }}>✓ Saved</span>
        )}
        {status === 'error' && (
          <span style={{ color: 'var(--error)', fontSize: 14, fontWeight: 500 }}>Save failed</span>
        )}
      </div>
    </form>
  )
}
