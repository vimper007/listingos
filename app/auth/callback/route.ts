import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase'

function generateSlug(name: string, userId?: string): string {
  const base =
    name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-') || 'agent'
  const suffix = (userId || randomUUID()).toLowerCase()
  return `${base}-realty-${suffix}`
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  const supabase = await createServerSupabaseClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/auth/login?error=confirm_failed`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  // Check if agent record already exists (admin-bypass signups already have one)
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('agents')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    // Standard email-confirmation flow: create agent from user metadata
    const fullName = (user.user_metadata?.full_name as string) || ''
    const phone = (user.user_metadata?.phone as string) || ''
    const slug = generateSlug(fullName || user.email?.split('@')[0] || 'agent', user.id)

    await admin.from('agents').insert({
      user_id: user.id,
      full_name: fullName,
      email: user.email!,
      phone,
      slug,
      plan: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
