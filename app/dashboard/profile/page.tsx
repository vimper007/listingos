import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import ProfileForm from '@/components/ProfileForm'
import type { Agent } from '@/lib/types'

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!agent) redirect('/auth/login')

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
        <p className="text-gray-500 text-sm mt-1">
          Your profile appears on public property pages.
        </p>
      </div>
      <ProfileForm agent={agent as Agent} />
    </div>
  )
}
