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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // 1. Create user + agent record server-side (admin client bypasses RLS)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, phone, email, password }),
    })

    const data = (await res.json()) as { error?: string }

    if (!res.ok) {
      setError(data.error ?? 'Signup failed')
      setLoading(false)
      return
    }

    // 2. Sign in client-side to establish the browser session
    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#ffffff' }}>
      {/* Left panel — hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-end relative overflow-hidden"
        style={{ background: '#0a0a0f' }}
      >
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200"
          alt="Luxury property"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.45,
          }}
        />
        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.3) 60%, transparent 100%)',
          }}
        />
        {/* Content */}
        <div style={{ position: 'relative', padding: '48px 48px', zIndex: 1 }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              color: '#ffffff',
              fontWeight: 700,
              lineHeight: 1.25,
              marginBottom: 28,
            }}
          >
            Your listings.
            <br />
            Your brand.
            <br />
            Your business.
          </h2>
          <ul className="space-y-3">
            {[
              'Generate marketing content in seconds',
              'MLS, Instagram, Email, WhatsApp & more',
              'Beautiful public property pages included',
            ].map((benefit) => (
              <li
                key={benefit}
                className="flex items-center gap-3"
                style={{ color: 'rgba(240,240,245,0.8)', fontSize: 15 }}
              >
                <span style={{ color: 'var(--primary)', flexShrink: 0 }}>◆</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16" style={{ background: '#ffffff' }}>
        <div style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <span style={{ color: 'var(--primary)', fontSize: 16 }}>◆</span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                color: 'var(--primary)',
                fontWeight: 700,
              }}
            >
              ListingOS
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 30,
              color: '#0a0a0f',
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Start your free trial
          </h1>
          <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 32 }}>
            14 days free, no credit card required
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}
              >
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-light"
                style={{ width: '100%', padding: '12px 16px', fontSize: 15 }}
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}
              >
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-light"
                style={{ width: '100%', padding: '12px 16px', fontSize: 15 }}
                placeholder="+1 555 000 0000"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-light"
                style={{ width: '100%', padding: '12px 16px', fontSize: 15 }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-light"
                style={{ width: '100%', padding: '12px 16px', fontSize: 15 }}
                placeholder="Min. 8 characters"
              />
            </div>

            {error && (
              <p
                style={{
                  color: '#dc2626',
                  fontSize: 14,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  padding: '10px 16px',
                  borderRadius: 8,
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full"
              style={{
                height: 50,
                borderRadius: 'var(--radius-md)',
                fontSize: 15,
                fontFamily: 'var(--font-body)',
                marginTop: 4,
              }}
            >
              {loading ? 'Creating account…' : 'Create free account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#6b7280', marginTop: 24 }}>
            Already have an account?{' '}
            <Link
              href="/auth/login"
              style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
