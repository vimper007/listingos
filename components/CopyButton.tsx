'use client'

import { useState } from 'react'

interface CopyButtonProps {
  text: string
}

export default function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors"
      style={
        copied
          ? { backgroundColor: '#d1fae5', borderColor: '#6ee7b7', color: '#065f46' }
          : { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#374151' }
      }
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}
