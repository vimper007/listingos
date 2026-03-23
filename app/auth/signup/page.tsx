'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Primary path: standard email confirmation with PKCE
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
        data: { full_name: fullName, phone },
      },
    })

    // Supabase silently returns empty identities when the email is already registered
    if (!signUpError && data?.user?.identities?.length === 0) {
      setError(
        'An account with this email already exists. Check your inbox for a confirmation link, or sign in.'
      )
      setLoading(false)
      return
    }

    if (!signUpError) {
      // Standard path succeeded — user needs to confirm their email
      setConfirmed(true)
      setLoading(false)
      return
    }

    // Check if the failure is due to the Supabase email rate limit (3/hr on free tier)
    const isRateLimit =
      signUpError.message.toLowerCase().includes('rate limit') ||
      signUpError.message.includes('over_email_send_rate_limit')

    if (!isRateLimit) {
      // Unrecoverable error — show it
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Fallback: email quota exceeded — use admin bypass via server route
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, phone, email, password }),
    })

    const resData = (await res.json()) as { error?: string }

    if (!res.ok) {
      setError(resData.error ?? 'Signup failed')
      setLoading(false)
      return
    }

    // Admin bypass succeeded — sign in directly (no confirmation needed)
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-2xl font-bold text-navy mb-2">Check your email</h1>
          <p className="text-gray-500 text-sm mb-6">
            We sent a confirmation link to <strong>{email}</strong>.<br />
            Click it to activate your account.
          </p>
          <p className="text-gray-400 text-xs">
            Wrong address?{' '}
            <button
              onClick={() => { setConfirmed(false); setEmail(''); setPassword('') }}
              className="text-gold underline"
            >
              Go back
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy">ListingOS</h1>
          <p className="text-gray-500 mt-2">Create your free account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent text-sm"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent text-sm"
                placeholder="+1 555 000 0000"
              />
            </div>

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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent text-sm"
                placeholder="Min. 8 characters"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy text-white py-2.5 rounded-lg font-medium hover:bg-navy-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-gold font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
