import { createClient } from '@/lib/supabase/server'
import Auth from '@/components/Auth'
import AppShell from '@/components/AppShell'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <Auth />
  }

  const { data: destinations, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <AppShell
      user={{ id: user.id, email: user.email ?? '' }}
      initialDestinations={destinations ?? []}
      initialError={error ? 'Дестинациите не можаха да бъдат заредени.' : null}
    />
  )
}
