'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'assistant' | 'user'
  content: string
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: "Hi! I can answer questions about this property. What would you like to know?",
}

export default function PropertyChat({ listingId }: { listingId: string }) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const userMessage = input.trim()
    if (!userMessage || isLoading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    // Add placeholder for streaming assistant response
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, listing_id: listingId }),
      })

      if (!res.ok || !res.body) {
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: "Sorry, I couldn't load a response. Please try again.",
          }
          return updated
        })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const current = accumulated
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: current }
          return updated
        })
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: "Sorry, I couldn't load a response. Please try again.",
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 20,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        height: 320,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#c9a84c',
            flexShrink: 0,
          }}
        />
        <p style={{ fontSize: 14, fontWeight: 600, color: '#111111', fontFamily: 'var(--font-body)' }}>
          Ask about this property
        </p>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? '#111111' : '#f5f5f5',
                color: msg.role === 'user' ? '#ffffff' : '#333333',
                fontSize: 13,
                lineHeight: 1.55,
                fontFamily: 'var(--font-body)',
              }}
            >
              {msg.content || (
                <span style={{ display: 'flex', gap: 4, alignItems: 'center', height: 16 }}>
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#aaa',
                        animation: `bounce-dots 1.2s ease-in-out ${delay}ms infinite`,
                        display: 'inline-block',
                      }}
                    />
                  ))}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '10px 12px',
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          gap: 8,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void handleSubmit(e)
            }
          }}
          placeholder="Ask a question…"
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 13,
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            outline: 'none',
            fontFamily: 'var(--font-body)',
            background: '#fafafa',
            color: '#111',
            opacity: isLoading ? 0.5 : 1,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#c9a84c'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.1)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            height: 36,
            padding: '0 14px',
            background: '#111111',
            color: '#ffffff',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            border: 'none',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: isLoading || !input.trim() ? 0.4 : 1,
            fontFamily: 'var(--font-body)',
            transition: 'opacity 0.15s',
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}
