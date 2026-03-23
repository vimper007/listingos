import { randomUUID } from 'node:crypto'
import { resolveMx } from 'node:dns/promises'
import { NextRequest, NextResponse } from 'next/server'
import { signupSchema } from '@/lib/schemas'
import { createAdminClient } from '@/lib/supabase'

function generateSlug(name: string, userId?: string): string {
  const base =
    name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-') || 'agent'
  const suffix = (userId || randomUUID()).toLowerCase()
  return `${base}-realty-${suffix}`
}

async function hasMxRecord(email: string) {
  const domain = email.split('@')[1]?.trim().toLowerCase()
  if (!domain) return false

  try {
    const records = await resolveMx(domain)
    return records.length > 0
  } catch (err) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: string }).code)
        : ''

    if (code === 'ENOTFOUND' || code === 'ENODATA' || code === 'ENODOMAIN') {
      return false
    }

    throw err
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = signupSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid signup data' },
        { status: 400 }
      )
    }

    const { fullName, phone, email, password } = parsed.data

    if (!(await hasMxRecord(email))) {
      return NextResponse.json({ error: 'Email domain cannot receive mail' }, { status: 400 })
    }

    const admin = createAdminClient()

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
      return NextResponse.json({ error: 'Signup failed - no user returned' }, { status: 400 })
    }

    const slug = generateSlug(fullName, authData.user.id)

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
      await admin.auth.admin.deleteUser(authData.user.id)
      const friendly =
        agentError.message.includes('agents_slug_key') ||
        agentError.message.toLowerCase().includes('duplicate key')
          ? 'That full name already generated an existing profile slug. Please try again.'
          : agentError.message
      return NextResponse.json({ error: friendly }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
