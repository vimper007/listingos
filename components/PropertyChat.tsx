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
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-80">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-semibold text-navy">Ask about this property</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-navy text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.content || (
                <span className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-gray-100 flex gap-2">
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
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-navy text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  )
}
