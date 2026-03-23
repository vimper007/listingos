'use client'

import { useState } from 'react'
import Link from 'next/link'
import CopyButton from './CopyButton'
import { createClient } from '@/lib/supabase-client'
import type { GeneratedContent } from '@/lib/types'
import type { ContentFieldKey } from '@/lib/gemini'

interface ContentTabsProps {
  initialContent: GeneratedContent
  listingId: string
}

type TabKey = ContentFieldKey

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: 'mls_description',
    label: 'MLS Description',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    key: 'instagram_post',
    label: 'Instagram',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    key: 'facebook_post',
    label: 'Facebook',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    key: 'email_template',
    label: 'Email',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    key: 'whatsapp_message',
    label: 'WhatsApp',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    key: 'tiktok_script',
    label: 'TikTok Script',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
]

export default function ContentTabs({ initialContent, listingId }: ContentTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('mls_description')
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const [regeneratingAll, setRegeneratingAll] = useState(false)
  const [regeneratingField, setRegeneratingField] = useState<TabKey | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [regenError, setRegenError] = useState<string | null>(null)

  function handleEdit(value: string) {
    setContent((prev) => ({ ...prev, [activeTab]: value }))
    setSaveStatus('idle')
  }

  async function handleSave() {
    setSaving(true)
    setSaveStatus('idle')
    const supabase = createClient()
    const { error } = await supabase
      .from('generated_content')
      .update({
        mls_description: content.mls_description,
        instagram_post: content.instagram_post,
        facebook_post: content.facebook_post,
        email_template: content.email_template,
        whatsapp_message: content.whatsapp_message,
        tiktok_script: content.tiktok_script,
      })
      .eq('id', content.id)

    setSaving(false)
    setSaveStatus(error ? 'error' : 'saved')
    setTimeout(() => setSaveStatus('idle'), 3000)
  }

  async function handleRegenerateField(field: TabKey) {
    setRegeneratingField(field)
    setRegenError(null)
    try {
      const response = await fetch('/api/generate/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, field }),
      })
      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Regeneration failed')
      }
      const updated = (await response.json()) as GeneratedContent
      setContent(updated)
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Regeneration failed')
    } finally {
      setRegeneratingField(null)
    }
  }

  async function handleRegenerateAll() {
    setRegeneratingAll(true)
    setRegenError(null)
    try {
      const response = await fetch('/api/generate/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId }),
      })
      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Regeneration failed')
      }
      const newContent = (await response.json()) as GeneratedContent
      setContent(newContent)
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Regeneration failed')
    } finally {
      setRegeneratingAll(false)
    }
  }

  const isRegeneratingThis = regeneratingField === activeTab
  const anyBusy = regeneratingAll || regeneratingField !== null
  const currentValue = content[activeTab]
  const charCount = currentValue?.length ?? 0

  return (
    <div className="flex gap-0 min-h-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Left: vertical tab list */}
      <div
        style={{
          width: 192,
          flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '8px 0',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2.5 w-full transition-all duration-150"
              style={{
                height: 40,
                padding: '0 14px',
                border: 'none',
                background: isActive ? 'var(--primary-muted)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: isActive ? 'inset 2px 0 0 var(--primary)' : 'none',
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  const el = e.currentTarget as HTMLElement
                  el.style.color = 'var(--text-primary)'
                  el.style.background = 'rgba(201,168,76,0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  const el = e.currentTarget as HTMLElement
                  el.style.color = 'var(--text-secondary)'
                  el.style.background = 'transparent'
                }
              }}
            >
              <span style={{ opacity: isActive ? 1 : 0.6, display: 'flex', alignItems: 'center' }}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          )
        })}

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '8px 14px' }} />

        {/* Property page link */}
        <Link
          href={`/listing/${listingId}`}
          target="_blank"
          className="flex items-center gap-2.5 transition-all duration-150"
          style={{
            height: 40,
            padding: '0 14px',
            color: 'var(--text-tertiary)',
            fontSize: 13,
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.color = 'var(--text-secondary)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.color = 'var(--text-tertiary)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Public Page
        </Link>
      </div>

      {/* Right: content editor */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: 'var(--surface-raised)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              color: 'var(--text-primary)',
              fontWeight: 600,
            }}
          >
            {tabs.find((t) => t.key === activeTab)?.label}
          </h3>
          <div className="flex items-center gap-3">
            <span style={{ color: 'var(--text-tertiary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              {charCount.toLocaleString()} chars
            </span>
            <CopyButton text={currentValue} />
          </div>
        </div>

        {/* Textarea */}
        <div style={{ flex: 1, padding: '20px 24px' }}>
          <textarea
            value={currentValue}
            onChange={(e) => handleEdit(e.target.value)}
            rows={14}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: 'var(--text-primary)',
              fontSize: 15,
              fontFamily: 'var(--font-body)',
              lineHeight: 1.7,
            }}
          />
        </div>

        {/* Error */}
        {regenError && (
          <div style={{ padding: '0 24px 12px' }}>
            <p
              style={{
                color: 'var(--error)',
                fontSize: 13,
                background: 'var(--error-muted)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {regenError}
            </p>
          </div>
        )}

        {/* Action bar */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          {/* Left: Regenerate this + Regenerate All */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleRegenerateField(activeTab)}
              disabled={anyBusy}
              className="flex items-center gap-1.5 transition-all duration-150"
              style={{
                height: 34,
                padding: '0 14px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                color: isRegeneratingThis ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 13,
                cursor: anyBusy ? 'not-allowed' : 'pointer',
                opacity: anyBusy && !isRegeneratingThis ? 0.5 : 1,
              }}
            >
              {isRegeneratingThis ? (
                <>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      border: '2px solid rgba(240,240,245,0.2)',
                      borderTopColor: 'var(--text-primary)',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  Regenerating…
                </>
              ) : (
                '↺ Regenerate'
              )}
            </button>

            <button
              type="button"
              onClick={handleRegenerateAll}
              disabled={anyBusy}
              className="flex items-center gap-1.5 transition-all duration-150"
              style={{
                height: 34,
                padding: '0 14px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                color: 'var(--text-tertiary)',
                fontSize: 13,
                cursor: anyBusy ? 'not-allowed' : 'pointer',
                opacity: anyBusy && !regeneratingAll ? 0.5 : 1,
              }}
            >
              {regeneratingAll ? (
                <>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      border: '2px solid rgba(240,240,245,0.2)',
                      borderTopColor: 'var(--text-tertiary)',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  Regenerating All…
                </>
              ) : (
                '↺ All'
              )}
            </button>
          </div>

          {/* Right: Save + status */}
          <div className="flex items-center gap-3">
            {saveStatus === 'saved' && (
              <span style={{ color: 'var(--success)', fontSize: 13 }}>✓ Saved</span>
            )}
            {saveStatus === 'error' && (
              <span style={{ color: 'var(--error)', fontSize: 13 }}>Save failed</span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || anyBusy}
              className="btn-gold flex items-center gap-2"
              style={{
                height: 34,
                padding: '0 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                opacity: saving || anyBusy ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
