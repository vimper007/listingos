'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setShowResend(false)
    setResendMessage(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      // Show resend button for unconfirmed accounts
      if (authError.message === 'Email not confirmed') {
        setShowResend(true)
      }
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleResend() {
    setResendLoading(true)
    setResendMessage(null)
    setError(null)

    const res = await fetch('/api/auth/resend-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = (await res.json()) as { error?: string }

    if (!res.ok) {
      setError(data.error ?? 'Failed to resend confirmation email')
    } else {
      setShowResend(false)
      setResendMessage('Confirmation email sent. Check your inbox.')
    }

    setResendLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy">ListingOS</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent text-sm"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-lg">
                <p>{error}</p>
                {showResend && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="mt-2 text-red-700 font-medium underline disabled:opacity-60"
                  >
                    {resendLoading ? 'Sending...' : 'Resend confirmation email'}
                  </button>
                )}
              </div>
            )}

            {resendMessage && (
              <p className="text-green-700 text-sm bg-green-50 px-4 py-2.5 rounded-lg">
                {resendMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy text-white py-2.5 rounded-lg font-medium hover:bg-navy-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-gold font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
