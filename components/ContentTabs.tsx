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

const tabs: { key: TabKey; label: string }[] = [
  { key: 'mls_description', label: 'MLS Description' },
  { key: 'instagram_post', label: 'Instagram' },
  { key: 'facebook_post', label: 'Facebook' },
  { key: 'email_template', label: 'Email' },
  { key: 'whatsapp_message', label: 'WhatsApp' },
  { key: 'tiktok_script', label: 'TikTok Script' },
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

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-navy shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <Link
          href={`/listing/${listingId}`}
          target="_blank"
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap ml-auto"
        >
          Property Page ↗
        </Link>
      </div>

      {/* Content area */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">
            {tabs.find((t) => t.key === activeTab)?.label}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleRegenerateField(activeTab)}
              disabled={anyBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {isRegeneratingThis ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
                  Regenerating…
                </>
              ) : (
                '↺ Regenerate this'
              )}
            </button>
            <CopyButton text={currentValue} />
          </div>
        </div>

        <textarea
          value={currentValue}
          onChange={(e) => handleEdit(e.target.value)}
          rows={12}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent resize-none font-mono leading-relaxed"
        />
      </div>

      {/* Error */}
      {regenError && (
        <p className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-lg mt-3">{regenError}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || anyBusy}
          className="px-5 py-2.5 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={handleRegenerateAll}
          disabled={anyBusy}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-60 transition-colors"
        >
          {regeneratingAll ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-3.5 h-3.5 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
              Regenerating All…
            </span>
          ) : (
            '↺ Regenerate All'
          )}
        </button>

        {saveStatus === 'saved' && (
          <span className="text-green-600 text-sm font-medium">✓ Saved</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-red-600 text-sm font-medium">Save failed</span>
        )}
      </div>
    </div>
  )
}
