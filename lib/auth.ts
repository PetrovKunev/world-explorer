import { createClient } from '@supabase/supabase-js'
import { NextAuthOptions } from 'next-auth'
import { SupabaseAdapter } from '@auth/supabase-adapter'

// Extend the session type to include user id
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceKey,
  }),
  providers: [
    // Можете да добавите провайдери тук (Google, GitHub, etc.)
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
} 