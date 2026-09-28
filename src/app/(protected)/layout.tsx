import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProtectedLayoutClient from './ProtectedLayoutClient'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <ProtectedLayoutClient userEmail={user.email || 'admin@cakezone.com'}>
      {children}
    </ProtectedLayoutClient>
  )
}
