import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-') +
    '-realty'
  )
}

export async function POST(request: NextRequest) {
  try {
    const { fullName, phone, email, password } = (await request.json()) as {
      fullName: string
      phone: string
      email: string
      password: string
    }

    const admin = createAdminClient()

    // 1. Create auth user with admin API — email_confirm:true skips confirmation email.
    //    This route is the FALLBACK for when the email quota is exceeded on standard signUp.
    //    user_metadata stored so /auth/callback can create the agent if ever needed.
    const { data: authData, error: signupError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
    })

    if (signupError) {
      return NextResponse.json({ error: signupError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Signup failed — no user returned' }, { status: 400 })
    }

    // 2. Create agent record using admin client (bypasses RLS)
    const slug = generateSlug(fullName)

    const { error: agentError } = await admin.from('agents').insert({
      user_id: authData.user.id,
      full_name: fullName,
      email,
      phone,
      slug,
      plan: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })

    if (agentError) {
      // Clean up the auth user so they can retry
      await admin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: agentError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
