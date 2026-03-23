import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--background)' }}>
      <Sidebar agent={agent} />
      <main className="flex-1 min-w-0 page-enter">{children}</main>
    </div>
  )
}
